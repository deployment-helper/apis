import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { SynthesisController } from './synthesis.controller';
import { AwsModule } from '@apps/app-management/aws/aws.module';
import { GcpModule } from '@app/shared/gcp/gcp.module';

describe('SynthesisController', () => {
  let controller: SynthesisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SynthesisController],
      imports: [ConfigModule.forRoot({ isGlobal: true }), AwsModule, GcpModule],
    }).compile();

    controller = module.get<SynthesisController>(SynthesisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
