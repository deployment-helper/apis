import { Test, TestingModule } from '@nestjs/testing';
import { Mp3Controller } from './mp3.controller';
import { BullModule } from '@nestjs/bull';
import { REDIS_QUEUE_MP3_GENERATOR } from '../constants';
import { AwsModule } from '@apps/app-management/aws/aws.module';
import { ConfigService } from '@nestjs/config';

describe('Mp3Controller', () => {
  let controller: Mp3Controller;

  beforeEach(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn(), // Mock the get method
    } as unknown as ConfigService;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Mp3Controller],
      imports: [
        BullModule.registerQueue({
          name: REDIS_QUEUE_MP3_GENERATOR,
        }),
        AwsModule,
      ],
      providers: [
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    controller = module.get<Mp3Controller>(Mp3Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
