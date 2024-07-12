import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '@apps/app-management/aws/aws.module';
import { GcpModule } from '@app/shared/gcp/gcp.module';

describe('VideoController', () => {
  let controller: VideoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      imports: [ConfigModule.forRoot({ isGlobal: true }), AwsModule, GcpModule],
    }).compile();

    controller = module.get<VideoController>(VideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
