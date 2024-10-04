import { Test, TestingModule } from '@nestjs/testing';
import { BatchController } from './batch.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  REDIS_QUEUE_VIDEO_GENERATOR,
  REDIS_QUEUE_VIDEO_RECORDER,
} from '../../batch-server/src/constants';
import { BullModule } from '@nestjs/bull';
import { Queue } from 'bull';

describe('BatchController', () => {
  let controller: BatchController;
  let recorderQueueMock: Queue;
  let generatorQueueMock: Queue;

  beforeEach(async () => {
    recorderQueueMock = {
      add: jest.fn(),
    } as unknown as Queue;

    generatorQueueMock = {
      add: jest.fn(),
    } as unknown as Queue;

    const configServiceMock = {
      getOrThrow: jest.fn(), // Mock the get method
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchController],
      providers: [
        ConfigService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: REDIS_QUEUE_VIDEO_RECORDER,
          useValue: recorderQueueMock,
        },
        {
          provide: REDIS_QUEUE_VIDEO_GENERATOR,
          useValue: generatorQueueMock,
        },
      ],
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        BullModule.registerQueue({
          name: REDIS_QUEUE_VIDEO_RECORDER,
        }),
        BullModule.registerQueue({
          name: REDIS_QUEUE_VIDEO_GENERATOR,
        }),
      ],
    }).compile();

    controller = module.get<BatchController>(BatchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
