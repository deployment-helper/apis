import { Test, TestingModule } from '@nestjs/testing';
import { TranslateController } from './translate.controller';
import { ConfigModule } from '@nestjs/config';
import { GcpModule } from '@app/shared/gcp/gcp.module';

describe('TranslateController', () => {
  let controller: TranslateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranslateController],
      imports: [ConfigModule.forRoot({ isGlobal: true }), GcpModule],
    }).compile();

    controller = module.get<TranslateController>(TranslateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
