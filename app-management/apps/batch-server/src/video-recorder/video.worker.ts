import puppeteer from 'puppeteer';

import { IWorker, TSlideInfo } from './types';
import { Injectable, Logger } from '@nestjs/common';
import { RunnerFactory } from './runner.factory';
import { AudioVideoMerger } from './audio-video.merger';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { IPresentationDto } from '../types';

@Injectable()
export class VideoWorker implements IWorker {
  private readonly logger = new Logger(VideoWorker.name);
  constructor(
    private runnerFactory: RunnerFactory,
    private avMerger: AudioVideoMerger,
    private fs: FsService,
    private ffmpeg: FfmpegService,
  ) {}
  async start(url: string, data?: IPresentationDto): Promise<any> {
    this.logger.log('Begin Worker');

    this.logger.log('Star browser');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--enable-gpu', '--use-angle'],
    });

    const page = await browser.newPage();
    this.logger.log('Get browser runner for given URL');
    const runner = this.runnerFactory.getBrowserRunner(url, page);
    this.logger.log('Start runner');
    const slidesImages: Array<TSlideInfo> = await runner.start(url, data);
    this.logger.log(`Slides count ${slidesImages.length}`);
    this.logger.log('Get Audio generator for given URL');
    const audioGenerator = this.runnerFactory.getAudioGenerator(url, data);

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
    this.logger.log('End worker');
  }
}
