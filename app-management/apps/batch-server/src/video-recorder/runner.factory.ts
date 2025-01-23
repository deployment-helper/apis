import { SharedService } from '@app/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ServerNames } from '@app/shared/types';
import { SlidesRunner } from './slides.runner';
import { SlidesAudioGenerator } from './slides-audio.generator';
import { S3Service } from '@app/shared/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { ImageService } from '@app/shared/image.service';
import { ApiRunner } from './api.runner';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { SynthesisService } from '@app/shared/gcp/synthesis.service';

@Injectable()
export class RunnerFactory {
  constructor(
    private sharedService: SharedService,
    private s3: S3Service,
    private fs: FsService,
    private ffmpeg: FfmpegService,
    private imageService: ImageService,
    private fireStore: FirestoreService,
    private synthesisService: SynthesisService,
  ) {}

  private readonly logger = new Logger(RunnerFactory.name);

  getBrowserRunner(url: string) {
    this.logger.log(`URL = ${url}`);
    const server: ServerNames = this.sharedService.getServerName(url);

    if (server === ServerNames['localhost:3000']) {
      this.logger.log('SlidesRunner initiated.');
      return new SlidesRunner(
        this.sharedService,
        this.fs,
        this.s3,
        this.imageService,
      );
    } else if (server === ServerNames['apis.app-management.com']) {
      this.logger.log('ApiRunner initiated.');
      return new ApiRunner(this.fireStore, this.fs, this.s3);
    } else {
      this.logger.error(`${server} not supported.`);
    }
  }

  getAudioGenerator(url: string) {
    const server: ServerNames = this.sharedService.getServerName(url);

    if (
      server === ServerNames['localhost:3000'] ||
      server === ServerNames['apis.app-management.com']
    ) {
      return new SlidesAudioGenerator(
        this.s3,
        this.fs,
        this.ffmpeg,
        this.synthesisService,
      );
    } else {
      this.logger.error(`${server} not supported.`);
    }
  }
}
