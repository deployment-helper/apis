import { Test, TestingModule } from '@nestjs/testing';
import { FsService } from './fs.service';
import { ConfigService } from '@nestjs/config';

describe('FsService', () => {
  let service: FsService;

  beforeEach(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn(), // Mock the get method
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FsService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<FsService>(FsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create file from file path', async () => {
    const imagePath =
      '/Users/vinaymavi/quiz-project-content/TeByuG1TZYJCUFFTxgP1/image-files/d0f1e258-7daf-4ddd-8efc-d7412f726eed.mp4';
    const textPath =
      '/Users/vinaymavi/quiz-project-content/TeByuG1TZYJCUFFTxgP1/text-files/d0f1e258-7daf-4ddd-8efc-d7412f726eed.txt';
    const videoPath =
      '/Users/vinaymavi/quiz-project-content/TeByuG1TZYJCUFFTxgP1/video-files/d0f1e258-7daf-4ddd-8efc-d7412f726eed.mp4';

    expect(
      service.getFullPathFromFilename(imagePath, 'text-files', 'txt'),
    ).toBe(textPath);
    expect(
      service.getFullPathFromFilename(imagePath, 'video-files', 'mp4'),
    ).toBe(videoPath);
  });
});
