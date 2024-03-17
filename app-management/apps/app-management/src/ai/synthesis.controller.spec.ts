import { Test, TestingModule } from '@nestjs/testing';
import { SynthesisController } from './synthesis.controller';

describe('SynthesisController', () => {
  let controller: SynthesisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SynthesisController],
    }).compile();

    controller = module.get<SynthesisController>(SynthesisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
