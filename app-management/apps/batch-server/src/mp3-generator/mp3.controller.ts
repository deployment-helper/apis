import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Post } from '@nestjs/common';
import { REDIS_QUEUE_MP3_GENERATOR } from '../constants';
import { Queue } from 'bull';
import { IMp3GeneratorDto } from '../types';

@Controller('mp3')
export class Mp3Controller {
  constructor(
    @InjectQueue(REDIS_QUEUE_MP3_GENERATOR) private readonly queue: Queue,
  ) {}

  @Post('merge')
  async merge(@Body() mp3: IMp3GeneratorDto) {
    const data = await this.queue.add(mp3);
    return data;
  }
}
