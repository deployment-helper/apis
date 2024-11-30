import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { BullModule } from '@nestjs/bull';
import {
  REDIS_QUEUE_VIDEO_GENERATOR,
  REDIS_QUEUE_VIDEO_RECORDER,
} from '../constants';
import { VideoProcessor } from './video.processor';
import { S3Service } from '@app/shared/aws/s3.service';
import { VideoGeneratorProcessor } from './video-generator.processor';
import { VideoWorker } from './video.worker';
import { RunnerFactory } from './runner.factory';
import { AudioVideoMerger } from './audio-video.merger';
import { SharedService } from '@app/shared';
import { FfmpegService } from '@app/shared/ffmpeg.service';
import { FsService } from '@app/shared/fs/fs.service';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { FontsService } from '@app/shared/fonts.service';
import { ImageService } from '@app/shared/image.service';
import { HttpModule } from '@nestjs/axios';
import { PresentationEntity } from '@apps/app-management/aws/presentation.entity';
import { DynamodbClientService } from '@apps/app-management/aws/dynamodb.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: REDIS_QUEUE_VIDEO_RECORDER,
    }),
    BullModule.registerQueue({
      name: REDIS_QUEUE_VIDEO_GENERATOR,
    }),
    HttpModule,
  ],
  controllers: [VideoController],
  providers: [
    VideoProcessor,
    VideoGeneratorProcessor,
    VideoWorker,
    RunnerFactory,
    AudioVideoMerger,
    S3Service,
    SharedService,
    FfmpegService,
    FsService,
    FirestoreService,
    DynamodbClientService,
    PresentationEntity,
    FontsService,
    ImageService,
  ],
})
export class VideoRecorderModule {}
