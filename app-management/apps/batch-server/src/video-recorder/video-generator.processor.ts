import { Process, Processor } from '@nestjs/bull';

import { REDIS_QUEUE_VIDEO_GENERATOR } from '../constants';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { IPresentationDto } from '../types';
import { ConfigService } from '@nestjs/config';
import { VideoWorker } from './video.worker';

@Injectable()
@Processor(REDIS_QUEUE_VIDEO_GENERATOR)
export class VideoGeneratorProcessor {
  private readonly logger = new Logger(VideoGeneratorProcessor.name);
  constructor(private readonly worker: VideoWorker) {}

  @Process()
  async record(job: Job<IPresentationDto>) {
    await this.worker.start(job.data.url, { ...job.data });
  }
}
