import { Process, Processor } from '@nestjs/bull';

import { REDIS_QUEUE_VIDEO_GENERATOR } from '../constants';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { IPresentationDto } from '../types';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { PresentationEntity } from '@apps/app-management/aws/presentation.entity';

@Injectable()
@Processor(REDIS_QUEUE_VIDEO_GENERATOR)
export class VideoGeneratorProcessor {
  private readonly logger = new Logger(VideoGeneratorProcessor.name);
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
    // need a Video Worker
  }
}
