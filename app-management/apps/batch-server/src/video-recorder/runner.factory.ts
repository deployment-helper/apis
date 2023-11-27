import { SharedService } from '@app/shared';
import {Injectable, Logger} from '@nestjs/common';
import { ServerNames } from '@app/shared/types';
import { SlidesRunner } from './slides.runner';
import { Page } from 'puppeteer';
import { SlidesAudioGenerator } from './slides-audio.generator';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';

@Injectable()
export class RunnerFactory {
  constructor(
    private sharedService: SharedService,
    private s3: S3Service,
    private fs: FsService,
    private ffmpeg: FfmpegService,
  ) {}
  private readonly logger =new Logger(RunnerFactory.name);
  getBrowserRunner(url: string, page: Page) {
    this.logger.log(`URL = ${url}`)
    const server: ServerNames = this.sharedService.getServerName(url);


    if (server === ServerNames['localhost:3000']) {
      return new SlidesRunner(page, this.sharedService, this.fs, this.s3);
    }else {
      this.logger.warn(`${server} not supported.`)
    }
  }

  getAudioGenerator(url: string, data: any) {
    const server: ServerNames = this.sharedService.getServerName(url);

    if (server === ServerNames['localhost:3000']) {
      return new SlidesAudioGenerator(this.s3, this.fs, this.ffmpeg);
    }
  }
}
