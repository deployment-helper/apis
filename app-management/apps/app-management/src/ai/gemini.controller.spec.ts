import { Test, TestingModule } from '@nestjs/testing';
import { GeminiController } from './gemini.controller';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from '@app/shared/gcp/gemini.service';

describe('GeminiController', () => {
  let controller: GeminiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeminiController],
      providers: [GeminiService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    controller = module.get<GeminiController>(GeminiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
