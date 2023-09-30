import { Module } from '@nestjs/common';
import { Mp3Controller } from './mp3.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_QUEUE_MP3_GENERATOR } from '../constants';
import { Mp3Processor } from './mp3.processor';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { SharedModule } from '@app/shared';

@Module({
  imports: [
    BullModule.registerQueue({
      name: REDIS_QUEUE_MP3_GENERATOR,
    }),
    SharedModule,
  ],
  controllers: [Mp3Controller],
  providers: [Mp3Processor, S3Service],
})
export class Mp3GeneratorModule {}
