import { IApiRunner } from './types';
import { Logger } from '@nestjs/common';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { FsService } from '@app/shared/fs/fs.service';
import { S3Service } from '@app/shared/aws/s3.service';
import { IScene } from '@app/shared/types';
import { IGenerateVideoDto } from '../types';
import { IProject } from '@apps/app-management/types';

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
async function saveImageFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "if-modified-since": "Sun, 04 Aug 2024 14:43:30 GMT",
        "if-none-match": "\"0b1f3114b1dcbcaa6945b119901173a5\"",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
      },
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    });
    const arrayBuffer = await response.arrayBuffer();
    await sleep(2);
    return Buffer.from(arrayBuffer);
}

export class ApiRunner implements IApiRunner {
  logger: Logger = new Logger(ApiRunner.name);

  constructor(
    private readonly fireStore: FirestoreService,
    private readonly fs: FsService,
    private readonly s3: S3Service,
  ) {}

  async start<T>(url: string, data: IGenerateVideoDto): Promise<T> {
    this.logger.log('Start API Runner');
    this.logger.log('URL: ', url);
    // Get video scenes
    // Download and save scenes image to local and return the paths and meta-data that required for audio and video generation
    const videoId = data.videoId;
    const video = await this.fireStore.get<any>('video', videoId);
    const project = await this.fireStore.get<IProject>(
      'project',
      video.projectId,
    );
    const docs = await this.fireStore.list<any>(`video/${videoId}/scenes`);

    // create image directory
    this.fs.checkAndCreateDir(`${videoId}/image-files`);
    const scenesInfo = [];
    const scenes: IScene[] = docs[0]?.scenes;
    // Iterate over scenes and download images
    for (const scene of scenes) {
      this.logger.log(JSON.stringify(scene));
      const fullPath = await this.downloadImageAndSave(scene.image, videoId);

      const title = Object.keys(scene.content).find((key) => {
        return (
          scene.content[key].type === 'input' &&
          scene.content[key].bodyCopyType === 'title'
        );
      });

      scenesInfo.push({
        file: fullPath,
        description: scene.description,
        slideid: scene.id,
        layout: scene.layoutId,
        meta: {
          name: scene.id,
          language: video.audioLanguage,
          voiceCode: video.voiceCode,
          projectId: video.projectId,
          backgroundMusic: video.backgroundMusic,
          title: scene.content[title]?.value ? scene.content[title].value : '',
          ...project,
        },
      });
    }

    return scenesInfo as T;
  }

  async stop(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  // URL format https://vm-presentations.s3.ap-south-1.amazonaws.com/public/4fdee958-fd00-4e7f-b627-644c0d4d9b5d
  async downloadImageAndSave(url: string, videoId: string) {
    // Download image from S3
    if(url.startsWith("https://cdn.midjourney.com/")){
      console.log("Downloading Midjourney image" + url);
      const image = url.replace('https://cdn.midjourney.com/','').split("/").join("_");
      const body = await saveImageFromUrl(url);
      console.log(body);
      const fullPath = await this.fs.createFile(
        `${videoId}/image-files/${image}`,
        body,
      );
      
      return fullPath;
    }
    else{
      const image = url.split('/').pop();
      const body = await this.s3.getObject(this.s3.getKeyFromPublicUrl(url));
      const fullPath = await this.fs.createFile(
        `${videoId}/image-files/${image}`,
        body,
      );
      return fullPath;
    }
    
  }
}
