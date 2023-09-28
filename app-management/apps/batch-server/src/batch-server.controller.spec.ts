import { Test, TestingModule } from '@nestjs/testing';
import { BatchServerController } from './batch-server.controller';
import { BatchServerService } from './batch-server.service';
import { AppService } from '@apps/app-management/app.service';

describe('BatchServerController', () => {
  let batchServerController: BatchServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BatchServerController],
      providers: [BatchServerService, AppService],
    }).compile();

    batchServerController = app.get<BatchServerController>(
      BatchServerController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(batchServerController.getHello()).toBe('Hello World!');
    });
  });
});
