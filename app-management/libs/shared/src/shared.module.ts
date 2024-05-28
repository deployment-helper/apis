import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FsService } from './fs/fs.service';
import { FfmpegService } from './ffmpeg.service';
import { ConfigService } from '@nestjs/config';
import { GcpModule } from './gcp/gcp.module';
import { FontsService } from './fonts.service';

@Module({
  providers: [
    SharedService,
    FsService,
    FfmpegService,
    ConfigService,
    FontsService,
  ],
  exports: [SharedService, FsService, FontsService],
  imports: [GcpModule],
})
export class SharedModule {}
