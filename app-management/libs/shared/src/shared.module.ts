import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { FsService } from './fs/fs.service';

@Module({
  providers: [SharedService, FsService],
  exports: [SharedService, FsService],
})
export class SharedModule {}
