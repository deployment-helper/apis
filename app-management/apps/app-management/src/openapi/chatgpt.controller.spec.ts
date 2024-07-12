import { Test, TestingModule } from '@nestjs/testing';
import { ChatgptController } from './chatgpt.controller';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { ConfigModule } from '@nestjs/config';

describe('ChatgptController', () => {
  let controller: ChatgptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatgptController],
      providers: [ChatgptService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    controller = module.get<ChatgptController>(ChatgptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
