import { Logger } from '@nestjs/common';
import { IWorker, TSlideInfo } from './types';
import { S3Service } from '@apps/app-management/aws/s3.service';

/**
 * This file create a arrary of MP3 info from S3 file
 */
export class SlidesAudioGenerator {
  private readonly logger = new Logger(SlidesAudioGenerator.name);
  constructor(private s3: S3Service) {}
  async start(slides: Array<TSlideInfo>) {
    const data: Array<TSlideInfo> = [];
    this.logger.log('Begin audio generator');
    for (const slide of slides) {
      const meta = slide.meta;
      this.logger.debug(meta);
      this.logger.log(`Meta ${JSON.stringify(meta)}`);
      if (meta?.audiourl) {
        const fileStr = await this.s3.get(meta.audiourl);
        const fileJson = JSON.parse(fileStr);
        data.push({
          file: fileJson.audioContent,
          meta: {
            encoding: 'base64',
            filename: this.mp3FileNameFromS3Key(meta.audiourl, false),
            pid: this.presentationIdFromS3Key(meta.audiourl),
          },
        });
      } else {
        this.logger.log('Generating empty file');
        data.push({
          file: Buffer.from(''),
          meta: {
            encoding: 'base64',
            filename: meta.slideid,
          },
        });
      }
    }
    this.logger.log('End audio generator');
    return data;
  }
  mp3FileNameFromS3Key(s3Key: string, withExtension = true) {
    return `${s3Key.split('audio/')[1]}${withExtension ? '.mp3' : ''}`;
  }

  presentationIdFromS3Key(s3Key: string, withExtension = true) {
    return s3Key.split('audio/')[0];
  }
}
