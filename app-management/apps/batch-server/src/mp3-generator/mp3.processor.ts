import { Process, Processor } from '@nestjs/bull';
import { join } from 'path';
import { Job } from 'bull';
import { REDIS_QUEUE_MP3_GENERATOR } from '../constants';
import { IMp3GeneratorDto } from '../types';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';

import { Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { PresentationEntity } from '@apps/app-management/aws/presentation.entity';

@Processor(REDIS_QUEUE_MP3_GENERATOR)
export class Mp3Processor {
  private readonly logger = new Logger(Mp3Processor.name);
  constructor(
    private readonly s3: S3Service,
    private readonly pres: PresentationEntity,
    private readonly fs: FsService,
  ) {}

  @Process()
  async record(job: Job<IMp3GeneratorDto>) {
    const mergeFileName = 'merge.mp3';

    const mp3Files: Array<string> = [];
    const dirPath = `${job.data.pid}/mp3files`;
    this.logger.log('MP3 file processing started');
    this.fs.createDir(dirPath);

    const metaFileTxt = await this.s3.get(job.data.s3File);
    const metaFileJson = JSON.parse(metaFileTxt);

    let fileName = metaFileJson.desc?.file;
    let mp3Base64 = await this.getMp3File(fileName);
    let fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);

    // Generate emtpy file
    const empty800msFile = this.fs.getFullPath(
      join(dirPath, 'empty800msfile.mp3'),
    );
    const empty200msFile = this.fs.getFullPath(
      join(dirPath, 'empty200msfile.mp3'),
    );

    await this.fs.deleteFile(empty200msFile);
    await this.fs.deleteFile(empty800msFile);
    this.logger.log('Start generating empty files');
    const encoding: string = await this.getEncoding(fullPath);
    this.logger.log(`Encoding type ${encoding}`);
    // 0.81 + 0.015 buffer beause of JS event loop timing
    await this.createEmtpyMp3File(encoding, 0, empty800msFile);
    await this.createEmtpyMp3File(encoding, 0, empty200msFile);

    // Desc
    // mp3Files.push(empty800msFile);
    fileName = metaFileJson.desc?.file;
    mp3Base64 = await this.getMp3File(fileName);
    fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
    mp3Files.push(fullPath);
    this.logger.log(`File ${fullPath} done`);

    // Slides
    const slides = metaFileJson.slides;

    for (const s of slides) {
      // Slide questions english
      mp3Files.push(empty800msFile);
      fileName = s.questionEn.file;
      mp3Base64 = await this.getMp3File(fileName);
      fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
      mp3Files.push(fullPath);
      this.logger.log(`File ${fullPath} done`);

      // Slide questions hindi
      if (s.questionHi) {
        fileName = s.questionHi.file;
        mp3Base64 = await this.getMp3File(fileName);
        fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
        mp3Files.push(fullPath);
        this.logger.log(`File ${fullPath} done`);
      }

      // options
      const options = s.options;
      mp3Files.push(empty800msFile);
      for (const o of options) {
        fileName = o.file;
        mp3Base64 = await this.getMp3File(fileName);
        fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
        mp3Files.push(fullPath);
        this.logger.log(`File ${fullPath} done`);
      }

      // Right answer
      mp3Files.push(empty800msFile);
      fileName = s.rightAnswer.file;
      mp3Base64 = await this.getMp3File(fileName);
      fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
      mp3Files.push(fullPath);
      this.logger.log(`File ${fullPath} done`);

      // Explantion
      mp3Files.push(empty800msFile);
      fileName = s.explanationEn.file;
      mp3Base64 = await this.getMp3File(fileName);
      fullPath = await this.saveMp3File(dirPath, fileName, mp3Base64);
      mp3Files.push(fullPath);
      this.logger.log(`File ${fullPath} done`);
    }

    // MP3 merge
    this.logger.log('Merge started');
    const outputFile = this.fs.getFullPath(join(dirPath, mergeFileName));
    await this.fs.deleteFile(outputFile);
    await this.mergeAllMp3Files(mp3Files, outputFile);
    this.logger.log('Merge end');

    // S3 upload
    this.logger.log('S3 uploading started');
    await this.s3.readAndUpload(outputFile, join(job.data.pid, mergeFileName));
    this.logger.log('S3 uploading ended');

    // DB update
    this.logger.log('DB update started');
    await this.pres.updateAudioMergeStatus(
      job.data.projectId,
      job.data.updatedAt,
      join(job.data.pid, mergeFileName),
      true,
    );
    this.logger.log('DB updated ended');
    this.logger.log('MP3 file processing ended');
  }

  async getMp3File(key: string) {
    const fileTxt = await this.s3.get(key);
    const fileJson = JSON.parse(fileTxt);
    return fileJson.audioContent;
  }

  mp3FileNameFromS3Key(s3Key: string) {
    return `${s3Key.split('audio/')[1]}.mp3`;
  }

  async saveMp3File(dir: string, fileName: string, mp3Data: string) {
    const fullPath = join(dir, this.mp3FileNameFromS3Key(fileName));

    await this.fs.createFile(fullPath, mp3Data, true);

    return this.fs.getFullPath(fullPath);
  }

  mergeAllMp3Files(inputFiles: Array<string>, outputFile) {
    return new Promise((resolve, reject) => {
      this.logger.log('Merging started');
      // Create a string of input files separated by a pipe '|'
      const inputFilesStr = inputFiles.join('|');

      // Construct the FFmpeg command
      const ffmpegCommand = `ffmpeg -i "concat:${inputFilesStr}" -acodec copy ${outputFile}`;

      // Execute the FFmpeg command
      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing FFmpeg: ${error}`);
          reject(error);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        resolve('done');
      });
    });
  }

  createEmtpyMp3File(encoding: string, durSec: number, outputFile) {
    return new Promise((resolve, reject) => {
      // Parse the extracted encoding parameters
      const match = encoding.match(/(\w+), (\d+) Hz, (\w+), (\w+)/);
      if (!match) {
        reject(new Error('Invalid encoding parameters.'));
        return;
      }
      const codec = match[1];
      const sampleRate = match[2];
      const channels = match[3] === 'mono' ? '1' : '2';

      // Create the ffmpeg command
      const command = `ffmpeg -f lavfi -i anullsrc=r=${sampleRate}:cl=stereo -t ${durSec} -acodec ${codec} -ar ${sampleRate} -ac ${channels} ${outputFile}`;
      console.log(`Executing command: ${command}`);

      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error}`);
          reject(error);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        resolve(outputFile);
      });
    });
  }

  getEncoding(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        `ffmpeg -i ${filePath} -hide_banner -f null /dev/null`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          // Extract relevant encoding parameters from stderr
          const match = stderr.match(/Audio: (.+),/);
          if (match && match[1]) {
            resolve(match[1]);
          } else {
            reject(new Error('Unable to extract encoding parameters.'));
          }
        },
      );
    });
  }
}
