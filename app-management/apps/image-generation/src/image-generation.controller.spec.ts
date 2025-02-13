import { Test, TestingModule } from '@nestjs/testing';
import { ImageGenerationController } from './image-generation.controller';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { ConfigModule } from '@nestjs/config';

describe('ImageGenerationController', () => {
  let imageGenerationController: ImageGenerationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ImageGenerationController],
      providers: [ChatgptService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    imageGenerationController = app.get<ImageGenerationController>(
      ImageGenerationController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(imageGenerationController.healthCheck()).toBe('OK');
    });
  });
});
