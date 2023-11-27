import { Test, TestingModule } from '@nestjs/testing';
import { FfmpegService } from './ffmpeg.service';

import { ConfigService } from '@nestjs/config';
import { FsService } from '@app/shared/fs/fs.service';

describe('FfmpegService', () => {
  let service: FfmpegService;

  beforeEach(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn(), // Mock the get method
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FfmpegService,
        FsService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<FfmpegService>(FfmpegService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
