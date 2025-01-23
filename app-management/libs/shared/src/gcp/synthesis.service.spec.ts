import { Test, TestingModule } from '@nestjs/testing';
import { SynthesisService } from './synthesis.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { S3Service } from '@app/shared/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';
import { FontsService } from '@app/shared/fonts.service';

describe('SynthesisService', () => {
  let service: SynthesisService;

  beforeEach(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn(), // Mock the get method
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SynthesisService,
        FsService,
        FontsService,
        S3Service,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
      imports: [HttpModule],
    }).compile();

    service = module.get<SynthesisService>(SynthesisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
