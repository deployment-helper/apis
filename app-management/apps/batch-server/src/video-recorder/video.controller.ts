import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Post } from '@nestjs/common';
import { REDIS_QUEUE } from '../constants';
import { Queue } from 'bull';
import { IPresentationDto } from '../types';

@Controller('video')
export class VideoController {
  constructor(@InjectQueue(REDIS_QUEUE) private readonly queue: Queue) {}

  @Post('record')
  async record(@Body() p: IPresentationDto) {
    const data = await this.queue.add(p);

    return data;
  }
}
