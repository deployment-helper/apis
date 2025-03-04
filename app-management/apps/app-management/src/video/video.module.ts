import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { GcpModule } from '@app/shared/gcp/gcp.module';
import { ProjectController } from './project.controller';
import { SharedService } from '@app/shared';
import { AwsModule } from '@app/shared/aws/aws.module';
import { GitHubService } from '@app/shared/github/github.service';

@Module({
  imports: [GcpModule, AwsModule],
  providers: [SharedService, GitHubService],
  controllers: [VideoController, ProjectController],
})
export class VideoModule {}
