import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FsService } from './fs/fs.service';
import { FfmpegService } from './ffmpeg.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [SharedService, FsService, FfmpegService, ConfigService],
  exports: [SharedService, FsService],
})
export class SharedModule {}
