import { Process, Processor } from '@nestjs/bull';
import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';

import { REDIS_QUEUE } from '../constants';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { IPresentationDto } from '../types';

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

function delay(dur: number): Promise<string> {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res('done');
    }, dur * 1000);
  });
}

const STORE_LOC =
  '/Users/vinaymavi/github/deployment-helper/apis/app-management';
@Processor(REDIS_QUEUE)
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  @Process()
  async record(job: Job<IPresentationDto>) {
    this.logger.log('Recording started');
    this.logger.log(job.data);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--enable-gpu', '--use-angle'],
    });
    const page = await browser.newPage();
    const recorder = new PuppeteerScreenRecorder(page, RecorderConfig);
    const videoPath = `${STORE_LOC}/${job.data.projectId}.mp4`;
    // Navigate the page to a URL
    await recorder.start(videoPath);
    const pageUrl = `${job.data.url}&apiKey=THISISLOCALDEVELOPMENTKEY`;
    this.logger.log(`PageURL = ${pageUrl}`);
    await page.goto(pageUrl);
    // Set screen size in 16:9 aspect ratio
    // { width: 1600, height: 900 }
    // { width: 1280, height: 720 }
    await page.setViewport({ width: 1280, height: 720 });
    const status = await delay(job.data.totalDur);
    this.logger.log(`Status = ${status}`);
    await Promise.all([recorder.stop(), browser.close()]).catch((e) => {
      this.logger.debug(e);
    });
    this.logger.log('Recording ended');
  }
}
