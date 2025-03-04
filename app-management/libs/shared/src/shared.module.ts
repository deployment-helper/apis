import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FsService } from './fs/fs.service';
import { FfmpegService } from './ffmpeg.service';
import { ConfigService } from '@nestjs/config';
import { GcpModule } from './gcp/gcp.module';
import { FontsService } from './fonts.service';
import { ImageService } from './image.service';
import { ChatgptService } from './openapi/chatgpt.service';
import { GeminiService } from './gcp/gemini.service';
import { AwsModule } from './aws/aws.module';
import { GitHubService } from './github/github.service';

@Module({
  providers: [
    SharedService,
    FsService,
    FfmpegService,
    ConfigService,
    FontsService,
    ImageService,
    ChatgptService,
    GeminiService,
    GitHubService,
  ],
  exports: [
    SharedService,
    FsService,
    FontsService,
    ImageService,
    GeminiService,
  ],
  imports: [GcpModule, AwsModule],
})
export class SharedModule {}
