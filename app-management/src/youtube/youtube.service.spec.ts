import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeService } from './youtube.service';
import { ConfigModule } from '@nestjs/config';

describe('YoutubeService', () => {
  let service: YoutubeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YoutubeService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    service = module.get<YoutubeService>(YoutubeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
