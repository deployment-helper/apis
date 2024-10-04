import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { InjectQueue } from '@nestjs/bull';
import {
  REDIS_QUEUE_VIDEO_GENERATOR,
  REDIS_QUEUE_VIDEO_RECORDER,
} from '@app/shared/constants';

import { Queue } from 'bull';
import { IGenerateVideoDto } from '@apps/batch-server/types';

@Controller('batch')
@UseGuards(AuthGuard)
export class BatchController {
  constructor(
    @InjectQueue(REDIS_QUEUE_VIDEO_RECORDER)
    private readonly recorderQueue: Queue,
    @InjectQueue(REDIS_QUEUE_VIDEO_GENERATOR)
    private readonly generatorQueue: Queue,
  ) {}

  @Post('generate/v2')
  async generateV2(@Body() p: IGenerateVideoDto) {
    const data = await this.generatorQueue.add(p);
    return data;
  }
}
