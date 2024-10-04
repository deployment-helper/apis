import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsController } from './workflows.controller';
import { ConfigModule } from '@nestjs/config';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { FirestoreService } from '@app/shared/gcp/firestore.service';

describe('WorkflowsController', () => {
  let controller: WorkflowsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowsController],
      providers: [ChatgptService, FirestoreService],
      imports: [ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    controller = module.get<WorkflowsController>(WorkflowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
