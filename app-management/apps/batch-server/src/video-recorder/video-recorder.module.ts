import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_QUEUE } from '../constants';
import { VideoProcessor } from './video.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: REDIS_QUEUE,
    }),
  ],
  controllers: [VideoController],
  providers: [VideoProcessor],
})
export class VideoRecorderModule {}
