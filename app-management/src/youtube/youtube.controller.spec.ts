import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeController } from './youtube.controller';
import { ConfigModule } from '@nestjs/config';
import { YoutubeService } from './youtube.service';

describe('YoutubeController', () => {
  let controller: YoutubeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YoutubeController],
      providers: [YoutubeService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    controller = module.get<YoutubeController>(YoutubeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
