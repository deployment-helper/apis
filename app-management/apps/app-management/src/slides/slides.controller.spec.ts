import { Test, TestingModule } from '@nestjs/testing';
import { SlidesController } from './slides.controller';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '@apps/app-management/aws/aws.module';
import { S3Service } from '@app/shared/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';
import { AwsModule as SharedAwsModule } from '@app/shared/aws/aws.module';

describe('SlidesController', () => {
  let controller: SlidesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlidesController],
      providers: [S3Service, FsService],
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AwsModule,
        SharedAwsModule,
      ],
    }).compile();

    controller = module.get<SlidesController>(SlidesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
