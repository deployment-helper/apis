import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { GcpModule } from '@app/shared/gcp/gcp.module';
import { ProjectController } from './project.controller';

@Module({
  imports: [GcpModule],
  controllers: [VideoController, ProjectController],
})
export class VideoModule {}
