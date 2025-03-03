import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '@apps/app-management/aws/aws.module';
import { GcpModule } from '@app/shared/gcp/gcp.module';
import { AwsModule as SharedAwsModule } from '@app/shared/aws/aws.module';
import { FsService } from '@app/shared/fs/fs.service';
import { SharedService } from '@app/shared/shared.service';
import { GitHubService } from '@app/shared/github/github.service';

describe('VideoController', () => {
  let controller: VideoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [FsService, SharedService, GitHubService],
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AwsModule,
        GcpModule,
        SharedAwsModule,
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
