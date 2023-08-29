import { Test, TestingModule } from '@nestjs/testing';
import { SlidesController } from './slides.controller';
import { ConfigModule } from '@nestjs/config';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';

describe('SlidesController', () => {
  let controller: SlidesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlidesController],
      imports: [ConfigModule.forRoot({ isGlobal: true }), DynamodbModule],
    }).compile();

    controller = module.get<SlidesController>(SlidesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
