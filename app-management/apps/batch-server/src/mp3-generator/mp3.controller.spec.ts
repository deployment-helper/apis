import { Test, TestingModule } from '@nestjs/testing';
import { Mp3Controller } from './mp3.controller';

describe('Mp3Controller', () => {
  let controller: Mp3Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Mp3Controller],
    }).compile();

    controller = module.get<Mp3Controller>(Mp3Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
