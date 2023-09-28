import { InjectQueue } from '@nestjs/bull';
import { Controller, Post } from '@nestjs/common';
import { REDIS_QUEUE } from '../constants';
import { Queue } from 'bull';

@Controller('video')
export class VideoController {
  constructor(@InjectQueue(REDIS_QUEUE) private readonly queue: Queue) {}

  @Post('record')
  async record() {
    const data = await this.queue.add({
      file: 'this is file',
      meta: {
        hello: 'world',
      },
    });

    return data;
  }
}
