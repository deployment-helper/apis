import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { AwsModule } from '../aws/aws.module';
import { S3Service } from '@app/shared/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, S3Service, FsService],
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule,
        AwsModule,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
