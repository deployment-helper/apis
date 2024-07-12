import { Test, TestingModule } from '@nestjs/testing';
import { SynthesisService } from './synthesis.service';

describe('SynthesisService', () => {
  let service: SynthesisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SynthesisService],
    }).compile();

    service = module.get<SynthesisService>(SynthesisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
