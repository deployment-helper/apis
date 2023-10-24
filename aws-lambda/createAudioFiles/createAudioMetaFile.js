import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import ky from "ky";
import { config } from "dotenv";
import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Buffer } from "buffer";
import * as mm from "music-metadata";

config();

const client = new S3Client({ region: "ap-south-1" });
const dbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: "ap-south-1",
  })
);
const GCP_API_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GCP_API_KEY}`;
const bucket = "vm-presentations";
const metaFileName = "audioMetaData.json";
const bucketPrefix = `s3://${bucket}/`;
const tableName = "presentations";
// TODO: need to remvoe this animation times from should be handled on client side
const fragementAnimationTime = 0;
const slideAnimationTime = 0.8;
//TODO: unit testing is pending

async function readS3File(key) {
  const input = {
    Bucket: bucket,
    Key: key,
  };
  const command = new GetObjectCommand(input);
  const resp = await client.send(command);
  const data = await resp.Body.transformToString();
  return data;
}

/**
 *
 * @param {JSON} data data in json format
 * @param {string} fileName
 * @returns
 */
async function writeS3File(data, fileName) {
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: `${fileName}`,
    Body: JSON.stringify(data),
  });

  const resp = await client.send(putCommand);
  return resp;
}
/**
 *
 * @param {string} text
 * @returns {
 * data: json,
 * size: number 'Kbs'
 * }
 */
async function createAudio(text) {
  const body = {
    input: {
      text,
    },
    voice: {
      languageCode: "hi-IN",
      name: "hi-IN-Neural2-C",
    },
    audioConfig: {
      audioEncoding: "MP3",
      effectsProfileId: ["headphone-class-device"],
      pitch: 0,
      speakingRate: 1,
    },
  };

  const data = await ky
    .post(GCP_API_ENDPOINT, {
      body: JSON.stringify(body),
    })
    .text();

  return {
    data: JSON.parse(data),
    size: Math.floor(Buffer.from(data).length / 1000),
  };
}
/**
 * We are doing rough calculation of duration base on provided Kbs.
 * @param {number} size in Kb
 */
function calculateDur(mp3Base64, gap = 0) {
  return new Promise(async (resolve, reject) => {
    try {
      // Decode the Base64 content to a binary buffer
      const buffer = Buffer.from(mp3Base64, "base64");

      // Parse the metadata of the MP3 file
      const metadata = await mm.parseBuffer(buffer, "audio/mpeg", {
        duration: true,
      });

      // Extract the duration
      const duration = metadata.format.duration;
      if (duration !== undefined) {
        resolve(parseFloat((duration + gap).toFixed(2)));
      } else {
        reject(new Error("Duration could not be determined."));
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Create audio and write respective file in S3
 * @param {string} audioText text for speach
 * @param {string} s3FileName
 * @returns {number} audio duration in sec
 */
async function createAudioAndWriteS3(audioText, s3FileName, gap = 0) {
  let audio = await createAudio(audioText);
  let dur = await calculateDur(audio.data.audioContent, gap);
  console.log(dur);
  await writeS3File(audio.data, s3FileName);

  return {
    file: s3FileName,
    dur: dur,
  };
}
/**
 *
 * @param {*} data JSON file
 * @param {*} bucket S3 bucket
 * @param {*} folderLocation presentation folder location in S3 bucket
 */
async function createAuidoAndMetaFile(data, folderLocation) {
  let count = 1;
  let totalDur = 0;

  const metadata = {
    totalDur: 0,
  };

  let s3FileName = `${folderLocation}/audio/${count++}-desc.json`;

  let audioInfo = await createAudioAndWriteS3(data.desc, s3FileName);
  totalDur += audioInfo.dur;
  metadata.desc = audioInfo;

  // Save final meta file
  metadata.slides = [];
  const slides = data.slides;
  let slideIndex = 1;

  for (let slide of slides) {
    const slideMetaData = { id: slide?.id };
    let allQuesDur = 0;
    let allOptDur = 0;
    let explanationDur = 0;
    // Question in english
    s3FileName = `${folderLocation}/audio/${count++}-q-${slideIndex}-questionEn.json`;
    audioInfo = await createAudioAndWriteS3(
      slide.questionEnSpeak,
      s3FileName,
      0
    );
    totalDur += audioInfo.dur;
    allQuesDur += audioInfo.dur;
    slideMetaData.questionEn = audioInfo;

    // Question in hindi
    if (slide.questionHi) {
      s3FileName = `${folderLocation}/audio/${count++}-q-${slideIndex}-questionHi.json`;
      audioInfo = await createAudioAndWriteS3(
        slide.questionHiSpeak,
        s3FileName
      );
      totalDur += audioInfo.dur;
      allQuesDur += audioInfo.dur;
      slideMetaData.questionHi = audioInfo;
    }

    // options
    slideMetaData.options = [];
    let optionIndex = 1;

    for (let option of slide.options) {
      s3FileName = `${folderLocation}/audio/${count++}-q-${slideIndex}-o-${optionIndex++}-en.json`;
      audioInfo = await createAudioAndWriteS3(option.speaking, s3FileName);
      totalDur += audioInfo.dur;
      allOptDur += audioInfo.dur;
      slideMetaData.options.push(audioInfo);
    }

    // right answer
    s3FileName = `${folderLocation}/audio/${count++}-q-${slideIndex}-rightAns.json`;
    audioInfo = await createAudioAndWriteS3(
      slide.rightAnswer.speaking,
      s3FileName,
      0
    );
    totalDur += audioInfo.dur;
    slideMetaData.rightAnswer = audioInfo;

    // explanation
    s3FileName = `${folderLocation}/audio/${count++}-q-${slideIndex}-explanationEn.json`;
    audioInfo = await createAudioAndWriteS3(
      slide.explanationEnSpeak,
      s3FileName,
      0
    );
    totalDur += audioInfo.dur;
    explanationDur += audioInfo.dur;

    slideMetaData.explanationEn = audioInfo;
    slideMetaData.allQuesDur = allQuesDur;
    slideMetaData.allOptDur = allOptDur + slideAnimationTime;
    slideMetaData.explanationDur = explanationDur;

    metadata.slides.push(slideMetaData);
    console.log(`Slide ${slideIndex} completed`);
    slideIndex++;
  }

  metadata.totalDur = totalDur;
  const metaFile = `${folderLocation}/${metaFileName}`;
  await writeS3File(metadata, metaFile);
  console.log(`Total duration =${metadata.totalDur}`);
  console.log(`Writing metaFile = ${metaFile} to S3`);
  return metaFile;
}

function getFolder(message) {
  const metaFile = message.s3File?.replace(bucketPrefix, "");
  const folder = metaFile.split("/")[0];
  console.log("Folder=", folder);
  return folder;
}

async function updatePresentation(message) {
  const command = new UpdateItemCommand({
    TableName: tableName,
    Key: marshall({
      projectId: message.projectId,
      updatedAt: message.updatedAt,
    }),
    UpdateExpression: "SET s3MetaFile = :val1, isAudioGenerated = :val2",
    ExpressionAttributeValues: marshall({
      ":val1": message.s3MetaFile,
      ":val2": true,
    }),
  });
  await dbClient.send(command);
}

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/GetObjectCommand/
export const handler = async (event) => {
  console.log("PROCESSING STARTED");
  const record = event.Records[0];
  const message = JSON.parse(record.Sns.Message);
  const folderLocation = getFolder(message);
  const presentationStr = await readS3File(
    `${folderLocation}/presentation.json`
  );
  const metaFile = await createAuidoAndMetaFile(
    JSON.parse(presentationStr),
    folderLocation
  );

  message.s3MetaFile = metaFile;

  await updatePresentation(message);
  console.log("Audio and meta file generation done");
  console.log("PROCESSING END");
};

export default handler;
