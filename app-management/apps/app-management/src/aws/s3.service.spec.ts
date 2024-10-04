import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { FsService } from '@app/shared/fs/fs.service';
import { ConfigModule } from '@nestjs/config';

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service, FsService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
