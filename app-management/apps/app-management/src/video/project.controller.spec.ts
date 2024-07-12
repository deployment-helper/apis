import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectController } from './project.controller';
import { AwsModule } from '@apps/app-management/aws/aws.module';
import { GcpModule } from '@app/shared/gcp/gcp.module';

describe('ProjectController', () => {
  let controller: ProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      imports: [ConfigModule.forRoot({ isGlobal: true }), AwsModule, GcpModule],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
