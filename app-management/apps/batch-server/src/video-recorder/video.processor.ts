import { Process, Processor } from '@nestjs/bull';
import { REDIS_QUEUE } from '../constants';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor(REDIS_QUEUE)
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  @Process()
  async record(job: Job<any>) {
    this.logger.log('Recording started');
    this.logger.log(job.data);
    this.logger.log('Recording ended');
  }
}
