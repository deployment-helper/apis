import { IApiRunner } from './types';
import { Logger } from '@nestjs/common';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { FsService } from '@app/shared/fs/fs.service';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { IScene } from '@app/shared/types';

export class ApiRunner implements IApiRunner {
  logger: Logger = new Logger(ApiRunner.name);

  constructor(
    private readonly fireStore: FirestoreService,
    private readonly fs: FsService,
    private readonly s3: S3Service,
  ) {}

  async start<T>(url: string, data: any): Promise<T> {
    this.logger.log('Start API Runner');
    this.logger.log('URL: ', url);
    // Get video scenes
    // Download and save scenes image to local and return the paths and meta-data that required for audio and video generation
    const videoId = data.videoId;
    const video = await this.fireStore.get<any>('video', videoId);
    const docs = await this.fireStore.list<any>(`video/${videoId}/scenes`);

    // create image directory
    this.fs.checkAndCreateDir(`${videoId}/image-files`);
    const scenesInfo = [];
    const scenes: IScene[] = docs[0]?.scenes;
    // Iterate over scenes and download images
    for (const scene of scenes) {
      this.logger.log(JSON.stringify(scene));
      const fullPath = await this.downloadS3ImageAndSave(scene.image, videoId);

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
          title: scene.content[title]?.value ? scene.content[title].value : '',
        },
      });
    }

    return scenesInfo as T;
  }

  async stop(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  // URL format https://vm-presentations.s3.ap-south-1.amazonaws.com/public/4fdee958-fd00-4e7f-b627-644c0d4d9b5d
  async downloadS3ImageAndSave(url: string, videoId: string) {
    // Download image from S3
    const image = url.split('/').pop();
    const body = await this.s3.getObject(this.s3.getKeyFromPublicUrl(url));
    const fullPath = await this.fs.createFile(
      `${videoId}/image-files/${image}`,
      body,
    );
    return fullPath;
  }
}
