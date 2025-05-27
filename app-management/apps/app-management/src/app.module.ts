import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { YoutubeModule } from './youtube/youtube.module';
import { SlidesModule } from './slides/slides.module';
import { AwsModule } from './aws/aws.module';
import { VideoModule } from './video/video.module';
import { AiModule } from './ai/ai.module';
import { OpenapiModule } from './openapi/openapi.module';
import { AgentModule } from './agent/agent.module';
import { WorkflowsController } from './workflows/workflows.controller';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { BatchController } from './batch.controller';
import { BullModule } from '@nestjs/bull';
import {
  REDIS_QUEUE_VIDEO_GENERATOR,
  REDIS_QUEUE_VIDEO_RECORDER,
} from '@apps/batch-server/constants';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.getOrThrow('REDIS_HOST'),
          port: config.getOrThrow('REDIS_PORT'),
          password: config.getOrThrow('REDIS_PASS'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: REDIS_QUEUE_VIDEO_RECORDER,
    }),
    BullModule.registerQueue({
      name: REDIS_QUEUE_VIDEO_GENERATOR,
    }),
    AuthModule,
    YoutubeModule,
    SlidesModule,
    AwsModule,
    VideoModule,
    AiModule,
    OpenapiModule,
    AgentModule,
  ],
  controllers: [AppController, WorkflowsController, BatchController],
  providers: [AppService, ChatgptService, FirestoreService],
})
export class AppModule {}
