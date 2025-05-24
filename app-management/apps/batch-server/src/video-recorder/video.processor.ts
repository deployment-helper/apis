import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Process, Processor } from '@nestjs/bull';
import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';

import { REDIS_QUEUE_VIDEO_RECORDER } from '../constants';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { IPresentationDto } from '../types';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '@app/shared/aws/s3.service';
import { PresentationEntity } from '@apps/app-management/aws/presentation.entity';

const RecorderConfig = {
  followNewTab: true,
  fps: 80,
  videoFrame: {
    width: 1024,
    height: 768,
  },
  videoCrf: 18,
  videoCodec: 'libx264',
  videoPreset: 'ultrafast',
  videoBitrate: 1000,
  autopad: {
    color: 'black' || '#35A5FF',
  },
  aspectRatio: '16:9',
};

const LOGGING_INTERVAL = 2;

/**
 * @deprecated This class is no longer in use we are using screenshot based video generation instead of recording the screen.
 */
@Injectable()
@Processor(REDIS_QUEUE_VIDEO_RECORDER)
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);
  private readonly storageDir: string;

  constructor(
    private readonly config: ConfigService,
    private readonly s3: S3Service,
    private readonly pres: PresentationEntity,
  ) {
    this.storageDir = this.config.getOrThrow('STORAGE_DIR');
  }

  @Process()
  async record(job: Job<IPresentationDto>) {
    this.logger.log('Recording started');
    this.logger.log(job.data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--enable-gpu', '--use-angle'],
    });

    const page = await browser.newPage();
    const recorder = new PuppeteerScreenRecorder(page, RecorderConfig);
    this.logger.log(`Storage DIR - ${this.storageDir}`);
    const dirPath = this.checkAndCreateDir(job.data.pid);
    const videoPath = join(dirPath, 'recording.mp4');
    this.checkAndDelete(videoPath);

    this.logger.log('Start recording');
    // Start recorder
    await recorder.start(videoPath);

    const pageUrl = `${job.data.url}&apiKey=THISISLOCALDEVELOPMENTKEY`;
    this.logger.log(`PageURL = ${pageUrl}`);

    await page.goto(pageUrl);
    // Set screen size in 16:9 aspect ratio
    // { width: 1600, height: 900 }
    // { width: 1280, height: 720 }
    await page.setViewport({ width: 1280, height: 720 });
    const status = await this.delay(job.data.totalDur);
    this.logger.log(`Status = ${status}`);
    await Promise.all([recorder.stop(), browser.close()]).catch((e) => {
      this.logger.debug(e);
    });
    this.logger.log('Recording ended');

    this.logger.log('S3 uploading start');
    await this.s3.readAndUpload(videoPath, `${job.data.pid}/recording.mp4`);
    this.logger.log('S3 uploading end');

    this.logger.log('DB update started');
    await this.pres.updateVideoGeneratedStatus(
      job.data.projectId,
      job.data.updatedAt,
      `${job.data.pid}/recording.mp4`,
      true,
    );
    this.logger.log('DB update ended');
  }

  delay(dur: number): Promise<string> {
    let timespent = 0;
    const interval = setInterval(() => {
      this.logger.log(`Time remaining ${dur - timespent} seconds`);
      timespent += LOGGING_INTERVAL;
    }, LOGGING_INTERVAL * 1000);

    return new Promise((res) => {
      setTimeout(() => {
        clearInterval(interval);
        res('done');
      }, dur * 1000);
    });
  }

  // TODO: can be a seprate library function
  checkAndCreateDir(dir: string) {
    try {
      this.logger.log(`checkAndCreateDir start dir=${dir}`);
      const fullPath = join(this.storageDir, dir);
      this.logger.log(`Fullpath = ${fullPath}`);
      if (!existsSync(fullPath)) {
        this.logger.log('Create directory');
        mkdirSync(fullPath);
      }
      this.logger.log('checkAndCreateDir end');
      return fullPath;
    } catch (error) {
      this.logger.error(error);
    }
  }

  checkAndDelete(filePath: string) {
    this.logger.log(`checkAndDelete start filePath =${filePath}`);
    // Check if the file exists
    if (existsSync(filePath)) {
      // Delete the file if it exists
      unlinkSync(filePath);
      this.logger.log(`File ${filePath} has been deleted.`);
    }
    this.logger.log('checkAndDelete end');
  }
}
