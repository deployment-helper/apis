import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_QUEUE } from '../constants';
import { VideoProcessor } from './video.processor';
import { S3Service } from '@apps/app-management/aws/s3.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: REDIS_QUEUE,
    }),
  ],
  controllers: [VideoController],
  providers: [VideoProcessor, S3Service],
})
export class VideoRecorderModule {}
