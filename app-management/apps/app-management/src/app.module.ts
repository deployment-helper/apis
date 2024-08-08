import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { YoutubeModule } from './youtube/youtube.module';
import { SlidesModule } from './slides/slides.module';
import { AwsModule } from './aws/aws.module';
import { VideoModule } from './video/video.module';
import { AiModule } from './ai/ai.module';
import { OpenapiModule } from './openapi/openapi.module';
import { WorkflowsController } from './workflows/workflows.controller';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    YoutubeModule,
    SlidesModule,
    AwsModule,
    VideoModule,
    AiModule,
    OpenapiModule,
  ],
  controllers: [AppController, WorkflowsController],
  providers: [AppService, ChatgptService],
})
export class AppModule {}
