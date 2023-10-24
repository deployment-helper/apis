import { IWorker, TSlideInfo } from './types';
import { S3Service } from '@apps/app-management/aws/s3.service';

export class SlidesAudioGenerator {
  constructor(private s3: S3Service) {}
  async start(slides: Array<TSlideInfo>) {
    const data: Array<TSlideInfo> = [];

    for (const slide of slides) {
      const meta = slide.meta;

      if (meta?.audioUrl) {
        const fileStr = await this.s3.get(meta.audioUrl);
        const fileJson = JSON.parse(fileStr);
        data.push({
          file: fileJson.audioContent,
          meta: {
            encoding: 'base64',
            filename: this.mp3FileNameFromS3Key(meta.audioUrl, false),
            pid: this.presentationIdFromS3Key(meta.audioUrl),
          },
        });
      } else {
        data.push({
          file: Buffer.from(''),
        });
      }
    }

    return data;
  }
  mp3FileNameFromS3Key(s3Key: string, withExtension = true) {
    return `${s3Key.split('audio/')[1]}${withExtension ? '.mp3' : ''}`;
  }

  presentationIdFromS3Key(s3Key: string, withExtension = true) {
    return s3Key.split('audio/')[0];
  }
}
