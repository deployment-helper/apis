import { InjectQueue } from '@nestjs/bull';
import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {
  REDIS_QUEUE_VIDEO_GENERATOR,
  REDIS_QUEUE_VIDEO_RECORDER,
} from '../constants';
import { Queue } from 'bull';
import { IPresentationDto } from '../types';
import {AuthGuard} from "@apps/app-management/auth/auth.guard";

@Controller('video')
@UseGuards(AuthGuard)
export class VideoController {
  constructor(
    @InjectQueue(REDIS_QUEUE_VIDEO_RECORDER)
    private readonly recorderQueue: Queue,
    @InjectQueue(REDIS_QUEUE_VIDEO_GENERATOR)
    private readonly generatorQueue: Queue,
  ) {}

  @Post('record')
  async record(@Body() p: IPresentationDto) {
    const data = await this.recorderQueue.add(p);

    return data;
  }

  @Post('generate')
  async generate(@Body() p: IPresentationDto) {
    const data = await this.generatorQueue.add(p);
    return data;
  }
}
