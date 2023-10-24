import { SharedService } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { ServerNames } from '@app/shared/types';
import { slides_v1 } from 'googleapis';
import { SlidesRunner } from './slides.runner';
import { Page } from 'puppeteer';
import { SlidesAudioGenerator } from './slides-audio.generator';
import { S3Service } from '@apps/app-management/aws/s3.service';

@Injectable()
export class RunnerFactory {
  constructor(private sharedService: SharedService, private s3: S3Service) {}

  getBrowserRunner(url: string, page: Page) {
    const server: ServerNames = this.sharedService.getServerName(url);

    if (server === ServerNames['localhost:3000']) {
      return new SlidesRunner(page, this.sharedService);
    }
  }

  getAudioGenerator(url: string) {
    const server: ServerNames = this.sharedService.getServerName(url);

    if (server === ServerNames['localhost:3000']) {
      return new SlidesAudioGenerator(this.s3);
    }
  }
}
