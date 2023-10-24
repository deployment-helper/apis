import puppeteer from 'puppeteer';

import { IWorker, TSlideInfo } from './types';
import { Injectable, Logger } from '@nestjs/common';
import { RunnerFactory } from './runner.factory';
import { AudioVideoMerger } from './audio-video.merger';

@Injectable()
export class VideoWorker implements IWorker {
  private readonly logger = new Logger(VideoWorker.name);
  constructor(
    private runnerFactory: RunnerFactory,
    private avMerger: AudioVideoMerger,
  ) {}
  async start(url: string, data?: any): Promise<any> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--enable-gpu', '--use-angle'],
    });

    const page = await browser.newPage();

    const runner = this.runnerFactory.getBrowserRunner(url, page);
    const slidesImages: Array<TSlideInfo> = await runner.start(url);

    const audioGenerator = this.runnerFactory.getAudioGenerator(url);
    const slidesAudios = await audioGenerator.start(slidesImages);

    await this.avMerger.merge(slidesImages, slidesAudios);
  }
}
