import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FsService } from './fs/fs.service';
import { FfmpegService } from './ffmpeg.service';

@Module({
  providers: [SharedService, FsService, FfmpegService],
  exports: [SharedService, FsService],
})
export class SharedModule {}
