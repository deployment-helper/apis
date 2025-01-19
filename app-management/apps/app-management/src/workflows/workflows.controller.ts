import {
  Body,
  Query,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { IProject } from '@apps/app-management/types';
import getAspectRatioImages from '@app/shared/fetchImageLinks';


function cleanSubtitles(lines: string[]): string[] {
  const cleanedLines: string[] = [];
  const seenLines: Set<string> = new Set();

  for (const line of lines) {
    // Remove lines with numbers, timestamps, and [Music]
    if (
      line.trim().match(/^\d+$/) ||
      line.includes('-->') ||
      line.includes('[Music]')
    ) {
      continue;
    }
    // Add non-empty, unique lines to cleanedLines
    const trimmedLine = line.trim();
    if (trimmedLine && !seenLines.has(trimmedLine)) {
      cleanedLines.push(trimmedLine + '\n'); // Ensure each line ends with a newline
      seenLines.add(trimmedLine);
    }
  }

  return cleanedLines;
}

@Controller('workflows')
@UseGuards(AuthGuard)
export class WorkflowsController {
  private readonly logger = new Logger(WorkflowsController.name);
  constructor(
    private readonly chatgptService: ChatgptService,
    private readonly fireStore: FirestoreService,
  ) {}

  @Post('youtube')
  // project_name: string
  async createVideoFromYouTube(
    @Body()
    data: { videoURL: string; projectID: string },
    @Req() req: any,
  ) {
    //yt-dlp --write-auto-sub --skip-download --sub-lang en --convert-subs srt -o "subtitle.srt" HnQcJ03oEUo
    this.logger.log('Start creating video from YouTube video.');
    // TODO: clean this file after the process.
    const cmd = 'yt-dlp --write-auto-sub --skip-download --sub-lang en --convert-subs srt -o "subtitle.srt" ' + data.videoURL; 
    this.logger.log('running ' + cmd);
    const stdout = execSync(
      cmd
    );

    this.logger.log('Finished creating video from YouTube video.');

    // Example subtitle lines (replace this with your actual subtitle lines)
    const srtFilePath = path.join('subtitle.srt.en.srt');
    // TODO: read file with fs service
    const lines: Buffer = fs.readFileSync(srtFilePath);

    // Clean the lines
    const cleanedLines = cleanSubtitles(lines.toString().split('\n'));

    // Save the cleaned subtitles to a new file
    // TODO: should create this file in project temp directory and clenup after the process
    const cleanedFilePath = path.join('cleaned_subtitle.srt');
    fs.writeFileSync(cleanedFilePath, cleanedLines.join(''));
    const promptPath = 'prompt.txt';
    this.logger.log('Start generating scenes script.');
    const gptResp = await this.chatgptService.generateScenesScript(
      cleanedFilePath,
      promptPath,
    );
    this.logger.log('GPT Response: ' + gptResp);
    const rawData = JSON.parse(gptResp);

    this.logger.log('Finished generating scenes script.');

    let scriptData: any = {};
    scriptData['Title'] = rawData['Title'];
    scriptData['Hook'] = rawData['Hook'];
    scriptData['Introduction'] = rawData['Introduction'];
    scriptData['Action'] = rawData['Action'];
    scriptData['Observation'] = rawData['Observation'];
    scriptData['Moral Lesson'] = rawData['Moral Lesson'];
    scriptData['Application'] = rawData['Application'];
    scriptData['Extended Reflection'] = rawData['Extended Reflection'];
    scriptData['Incorporating Personal Growth'] =
      rawData['Incorporating Personal Growth'];
    scriptData['Motivational Dialogues'] = rawData['Motivational Dialogues'];
    scriptData['Conclusion'] = rawData['Conclusion'];
    scriptData['Call to Action'] = rawData['Call to Action'];

    const videoTitle = scriptData.Title;
    let sceneDescriptions = [];
    const keys = Object.keys(scriptData);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (key != 'Title') {
        if (scriptData[key] != null) sceneDescriptions[i] = scriptData[key];
      }
    }

    // get the Project
    const project = await this.fireStore.get<IProject>(
      'project',
      data.projectID,
    );
    console.log(project);
    this.logger.log('Start creating video.');
    // Create the video
    const videoData = {
      projectId: project.id,
      projectName: project.projectName,
      name: videoTitle,
      description: videoTitle,
      backgroundMusic: project.defaultBackgroundMusic,
      //overlay: project.defaultOverlay,
      audioLanguage: "en-US", //project.defaultLanguage,
      userId: "bda80c16-c900-45e8-a079-49048d56cd54",
      voiceCode: "en-US-Studio-Q", // project.defaultVoice,
      isDeleted: false,
      isPublished: false,
    };
    console.log(videoData);
    const video = await this.fireStore.add('video', {
      ...videoData,
      isDeleted: false,
      userId: req.user.sub,
    });
    console.log(video);

    sceneDescriptions = sceneDescriptions.filter(function (item) {
      return item != null;
    });

    let scenesData = [];
    console.log("sceneDescriptions Length" + sceneDescriptions.length);
    for (let i = 0; i < sceneDescriptions.length; i++) {
      if (sceneDescriptions[i]) {
        let images = await getAspectRatioImages(sceneDescriptions[i].slice(0,70));
        if(images.length == 0){
          images = await getAspectRatioImages(sceneDescriptions[i].slice(35,105));
        }
        if(images.length == 0){
          images = await getAspectRatioImages(sceneDescriptions[i].slice(0,35));
        }
        console.log(images);
        let image = images[0] || project?.assets[
          Math.ceil(Math.random() * 1000) % project?.assets?.length
        ];
      
        scenesData.push({
          id: uuidv4(),
          content: {
            image: {
              type: 'image',
              name: 'image',
              value: image,
              placeholder: 'Image',
            },
          },
          description: sceneDescriptions[i],
          image: image,
          layoutId: 'layout2',
        });
       }
    }

    const scenes = await this.fireStore.add(`video/${video.id}/scenes`, {
      videoId: video.id,
      scenes: scenesData,
    });
    console.log(scenes);

    const updatedVideo = this.fireStore.update('video', video.id, {
      scenesId: scenes.id,
    });
    console.log(updatedVideo);
    this.logger.log('Finished creating video.');
    return video;
  }
  

  @Get('image-links')
  async getImageLinks(@Query('prompt') prompt: string): Promise<string[]> {
    try {
      const images = await getAspectRatioImages(prompt);
      console.log('Image Links:', images);
      return images;
    } catch (error) {
      console.error('Error fetching image links:', error);
      return [];
    }
  }

  @Get('list')
  async list(@Req() req: any) {
    return { list: 1 };
  }
}