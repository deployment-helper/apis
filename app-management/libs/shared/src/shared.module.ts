import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FsService } from './fs/fs.service';
import { FfmpegService } from './ffmpeg.service';
import { ConfigService } from '@nestjs/config';
import { GcpModule } from './gcp/gcp.module';
import { FontsService } from './fonts.service';
import { ImageService } from './image.service';

@Module({
  providers: [
    SharedService,
    FsService,
    FfmpegService,
    ConfigService,
    FontsService,
    ImageService,
  ],
  exports: [SharedService, FsService, FontsService, ImageService],
  imports: [GcpModule],
})
export class SharedModule {}
