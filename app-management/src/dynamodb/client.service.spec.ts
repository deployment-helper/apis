import { Test, TestingModule } from '@nestjs/testing';
import { DynamodbClientService } from './client.service';

describe('ClientService', () => {
  let service: DynamodbClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamodbClientService],
    }).compile();

    service = module.get<DynamodbClientService>(DynamodbClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
