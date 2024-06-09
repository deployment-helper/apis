import puppeteer from 'puppeteer';

import { IWorker, TSlideInfo, TSlideInfoArray } from './types';
import { Injectable, Logger } from '@nestjs/common';
import { RunnerFactory } from './runner.factory';
import { AudioVideoMerger } from './audio-video.merger';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { IGenerateVideoDto, IPresentationDto } from '../types';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { PresentationEntity } from '@apps/app-management/aws/presentation.entity';
import { ConfigService } from '@nestjs/config';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { FieldValue } from '@google-cloud/firestore';
import { v4 as uuid } from 'uuid';
import { SlidesRunner } from './slides.runner';
import { ApiRunner } from './api.runner';

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
    private fireStore: FirestoreService,
  ) {
    this.nodeEnv = config.getOrThrow('NODE_ENV');
  }

  /**
   * @Deprecated This method is deprecated and should not be used
   */
  //  This version of the start is designed to get generated mp3 files from s3 server
  async start(url: string, data?: IPresentationDto): Promise<any> {
    try {
      this.logger.log('Begin Worker');

      this.logger.log('Star browser');
      // TODO: browser should be created in a separate service
      const browser = await puppeteer
        .launch({
          timeout: 0,
          args: ['--no-sandbox', '--enable-gpu', '--disable-setuid-sandbox'],
        })
        .catch((e) => console.error('Error launching Chrome:', e));

      if (!browser) {
        throw new Error('Browser not created');
      }

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(60 * 1000);
      this.logger.log('Get browser runner for given URL');
      const runner = this.runnerFactory.getBrowserRunner(url);
      this.logger.log('Start runner');
      const slidesImages: Array<TSlideInfo> = await runner.start(
        url,
        data,
        page,
      );
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
      const totalDuration = await this.ffmpeg.getTotalDuration(videoPaths);
      this.logger.debug('Total duration', totalDuration);
      await this.ffmpeg.mergeToFile(
        videoPaths,
        preparedVideoPath,
        totalDuration,
      );
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

  // This version of start method is designed to get generated mp3 files during the process
  async startV2(url: string, data?: IGenerateVideoDto): Promise<any> {
    try {
      this.logger.log('Begin Worker');
      const startTime = new Date().getTime();
      const scenesInfo = await this.generateImages(url, data);
      this.logger.log('scenesImages count', scenesInfo.length);

      const scenesAudios = await this.generateAudios(scenesInfo, data);
      this.logger.log('scenesAudios count', scenesAudios.length);

      this.logger.log('Begin audio and image merge');
      // TODO: In this merge last argument should be dynamic as per screen runner(Runner for getting scene images)
      const videoPaths = await this.avMerger.merge(
        scenesInfo,
        scenesAudios,
        false,
      );
      this.logger.log('End audio and image merge');

      this.logger.log('Merge all videos');
      const uniqueVideoName = uuid();
      const preparedVideoPath = this.fs.getFullPath(
        `${data.videoId}/${uniqueVideoName}.mp4`,
      );

      const totalDuration = await this.ffmpeg.getTotalDuration(videoPaths);
      this.logger.debug('Total duration', totalDuration);
      await this.ffmpeg.mergeToFile(
        videoPaths,
        preparedVideoPath,
        totalDuration,
      );

      const preapredVideoDuration = await this.ffmpeg.mp3Duration(
        preparedVideoPath,
      );

      this.logger.debug('Prepared video duration', preapredVideoDuration);
      this.logger.log('End merge all videos');
      this.logger.log('Begin S3 upload');

      await this.s3.readAndUpload(
        preparedVideoPath,
        `${data.videoId}/${preparedVideoPath}.mp4`,
      );
      this.logger.log('End S3 upload');

      this.logger.log('Begin DB update');

      await this.fireStore.update('video', data.videoId, {
        generatedVideoInfo: FieldValue.arrayUnion({
          cloudFile: `${data.videoId}/${preparedVideoPath}.mp4`,
          version: data.version,
          date: new Date().toISOString(),
        }),
      });

      this.logger.log('End DB update');

      if (this.nodeEnv !== 'development') {
        this.logger.log('Start cleanup');
        await this.fs.deleteDir(this.fs.getFullPath(data.videoId));
        this.logger.log('End cleanup');
      }
      const endTime = new Date().getTime();
      // Log total time taken in seconds
      this.logger.log(
        `Total time taken:${(endTime - startTime) / 1000} seconds`,
      );
      this.logger.log('End worker');
    } catch (e) {
      this.logger.error(e);
    }
  }

  async generateAudios(
    scenesImages: Array<TSlideInfo>,
    data: IGenerateVideoDto,
  ) {
    this.logger.log('Get Audio generator for given URL');
    const audioGenerator = this.runnerFactory.getAudioGenerator(data.url);
    this.logger.log('Start audio generator');
    const slidesAudios = await audioGenerator.startV2(scenesImages, data);
    return slidesAudios;
  }

  async generateImages(url: string, data: IGenerateVideoDto): Promise<any> {
    const runner = this.runnerFactory.getBrowserRunner(url);
    if (runner && runner instanceof ApiRunner) {
      this.logger.log('Start API Runner');
      const slidesImages = await runner.start<TSlideInfoArray>(url, data);
      return slidesImages;
    } else if (runner && runner instanceof SlidesRunner) {
      this.logger.log('Start slides runner');
      this.logger.log('Star browser');
      const browser = await puppeteer
        .launch({
          headless: 'new',
          timeout: 0,
          args: ['--no-sandbox', '--enable-gpu', '--disable-setuid-sandbox'],
        })
        .catch((e) => console.error('Error launching Chrome:', e));

      if (!browser) {
        throw new Error('Browser not created');
      }

      const page = await browser.newPage();
      this.logger.log('Get browser runner for given URL');

      this.logger.log('Start runner');
      const slidesImages: Array<TSlideInfo> = await runner.start(
        url,
        {
          pid: data.videoId,
        },
        page,
      );
      this.logger.log('Stopping runner');
      await runner.stop();
      this.logger.log('Stopping browser');
      await browser.close();
      return slidesImages;
    }
  }
}
