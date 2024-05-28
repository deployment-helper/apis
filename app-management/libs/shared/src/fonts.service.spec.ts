import { Test, TestingModule } from '@nestjs/testing';
import { FontsService } from './fonts.service';
import { ConfigService } from '@nestjs/config';
import { ELanguage } from '@app/shared/types';

describe('FontsService', () => {
  let service: FontsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FontsService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('/tmp'),
          } as unknown as ConfigService,
        },
      ],
    }).compile();

    service = module.get<FontsService>(FontsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should getFontFilePath', () => {
    const fonts = service.getFontFilePath(ELanguage['English (India)']);
    expect(fonts).toEqual('/tmp/Roboto-Regular.ttf');
  });
});
