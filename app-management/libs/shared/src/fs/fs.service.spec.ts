import { Test, TestingModule } from '@nestjs/testing';
import { FsService } from './fs.service';
import {ConfigService} from "@nestjs/config";

describe('FsService', () => {
  let service: FsService;

  beforeEach(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn(), // Mock the get method
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [FsService,{
        provide:ConfigService,
        useValue:configServiceMock
      }],
    }).compile();

    service = module.get<FsService>(FsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
