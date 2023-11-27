import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import {
  REDIS_QUEUE_VIDEO_RECORDER,
  REDIS_QUEUE_VIDEO_GENERATOR,
} from '../constants';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

describe('VideoController', () => {
  let controller: VideoController;
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
      controllers: [VideoController],
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
        BullModule.registerQueue({
          name: REDIS_QUEUE_VIDEO_RECORDER,
        }),
        BullModule.registerQueue({
          name: REDIS_QUEUE_VIDEO_GENERATOR,
        }),
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
