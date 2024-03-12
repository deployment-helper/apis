import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { GcpModule } from '@app/shared/gcp/gcp.module';

@Module({
  imports: [GcpModule],
  controllers: [VideoController],
})
export class VideoModule {}
