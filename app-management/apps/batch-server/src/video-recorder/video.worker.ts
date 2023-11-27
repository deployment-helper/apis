import puppeteer from 'puppeteer';

import { IWorker, TSlideInfo } from './types';
import { Injectable, Logger } from '@nestjs/common';
import { RunnerFactory } from './runner.factory';
import { AudioVideoMerger } from './audio-video.merger';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { IPresentationDto } from '../types';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { PresentationEntity } from '@apps/app-management/aws/presentation.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoWorker implements IWorker {
  private readonly logger = new Logger(VideoWorker.name);
  private nodeEnv;
  constructor(
    private runnerFactory: RunnerFactory,
    private avMerger: AudioVideoMerger,
    private fs: FsService,
    private ffmpeg: FfmpegService,
    private s3: S3Service,
    private readonly pres: PresentationEntity,
    private config: ConfigService,
  ) {
    this.nodeEnv = config.getOrThrow('NODE_ENV');
  }
  async start(url: string, data?: IPresentationDto): Promise<any> {
    try {
      this.logger.log('Begin Worker');

      this.logger.log('Star browser');
      const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      }).catch(e => console.error('Error launching Chrome:', e));;

      if(!browser){
        throw new Error('Browser not created')
      }

      const page = await browser.newPage();
      this.logger.log('Get browser runner for given URL');
      const runner = this.runnerFactory.getBrowserRunner(url, page);
      this.logger.log('Start runner');
      const slidesImages: Array<TSlideInfo> = await runner.start(url, data);
      this.logger.log(`Slides count ${slidesImages.length}`);
      this.logger.log('Get Audio generator for given URL');
      const audioGenerator = this.runnerFactory.getAudioGenerator(url);

      this.logger.log('Start audio generator');
      const slidesAudios = await audioGenerator.start(slidesImages, data);
      this.logger.log(`Slides audio count ${slidesAudios.length}`);
      this.logger.log('Begin audio and image merge');
      const videoPaths = await this.avMerger.merge(slidesImages, slidesAudios);
      this.logger.log('End audio and image merge');

      this.logger.log('Stoping browser');
      await browser.close();
      const preparedVideoPath = this.fs.getFullPath(`${data.pid}/output.mp4`);
      await this.ffmpeg.mergeToFile(videoPaths, preparedVideoPath);
      this.logger.log(`Begin S3 upload ${`${data.pid}/output.mp4`}`);
      await this.s3.readAndUpload(preparedVideoPath, `${data.pid}/output.mp4`);
      this.logger.log('End S3 upload');
      this.logger.log('Begin DB update');
      await this.pres.updateVideoGeneratedStatus(
        data.projectId,
        data.updatedAt,
        `${data.pid}/output.mp4`,
        true,
      );
      this.logger.log('End DB update');
      this.logger.log('End worker');

      if (this.nodeEnv !== 'development') {
        this.logger.log('Start cleanup');
        await this.fs.deleteDir(this.fs.getFullPath(data.pid));
        this.logger.log('End cleanup');
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}
