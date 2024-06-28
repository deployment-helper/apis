import { Test, TestingModule } from '@nestjs/testing';
import { ChatgptService } from './chatgpt.service';
import { ConfigModule } from '@nestjs/config';

describe('ChatgptService', () => {
  let service: ChatgptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatgptService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    service = module.get<ChatgptService>(ChatgptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
