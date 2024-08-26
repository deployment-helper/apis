import { Test, TestingModule } from '@nestjs/testing';
import { FfmpegService } from './ffmpeg.service';

import { ConfigService } from '@nestjs/config';
import { FsService } from '@app/shared/fs/fs.service';
import { FontsService } from '@app/shared/fonts.service';

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
        FontsService,
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

  it('prepareDrawtextFilterText', async () => {
    const output = await service.prepareDrawtextFilterText(
      {
        type: 'title',
        text: 'Hello World',
      },
      'test_path',
    );
    const output1 = await service.prepareDrawtextFilterText(
      {
        type: 'title',
        // Loren Ipsum text
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      },
      'test_path',
    );

    const expectedOutput = {
      textFile: 'test_path',
      lineCount: 1,
      fontSize: 120,
    };

    const expectedOutput1 = {
      textFile: 'test_path',
      lineCount: 6,
      fontSize: 120,
    };

    expect(output).toEqual(expectedOutput);
    expect(output1).toEqual(expectedOutput1);
  });
});
