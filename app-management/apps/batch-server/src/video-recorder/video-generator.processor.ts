import { Process, Processor } from '@nestjs/bull';

import { REDIS_QUEUE_VIDEO_GENERATOR } from '../constants';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EWorkerVersion, IGenerateVideoDto, IPresentationDto } from '../types';
import { VideoWorker } from './video.worker';

@Injectable()
@Processor(REDIS_QUEUE_VIDEO_GENERATOR)
export class VideoGeneratorProcessor {
  private readonly logger = new Logger(VideoGeneratorProcessor.name);
  constructor(private readonly worker: VideoWorker) {}

  @Process()
  async record(job: Job<IPresentationDto | IGenerateVideoDto>) {
    if ('version' in job.data && job.data.version === EWorkerVersion.V1) {
      const data = job.data as IGenerateVideoDto;
      await this.worker.startV2(data.url, data);
    } else {
      const data = job.data as IPresentationDto;
      await this.worker.start(data.url, data);
    }
  }
}
