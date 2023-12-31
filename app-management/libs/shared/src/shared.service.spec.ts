import { Test, TestingModule } from '@nestjs/testing';
import { SharedService } from './shared.service';
import { ServerNames } from '@app/shared/types';
import { ConfigService } from '@nestjs/config';

describe('SharedService', () => {
  let service: SharedService;

  beforeEach(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn(() => 'devkey'), // Mock the get method
    } as unknown as ConfigService;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<SharedService>(SharedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should getServerName Google', () => {
    const serverName = service.getServerName(
      'https://docs.google.com/document/d/1CCdGJ972m4idwctQGAmXvxttyNtRQINPnamlptCJ8lU/edit',
    );

    expect(serverName).toBe(ServerNames['docs.google.com']);
  });
  it('should getServerName Slides', () => {
    let serverName = service.getServerName('http://localhost:3000/xyz');

    expect(serverName).toBe(ServerNames['localhost:3000']);

    serverName = service.getServerName('https://webapps-psi.vercel.app/auth');

    expect(serverName).toBe(ServerNames['webapps-psi.vercel.app']);
  });
  it('Should getServiceKeyUrl', () => {
    let url = service.getServiceKeyUrl('http://example.com');

    expect(url).toBe(`http://example.com/?apiKey=devkey`);

    url = service.getServiceKeyUrl('http://example.com?a=b');

    expect(url).toBe(`http://example.com/?a=b&apiKey=devkey`);
  });
});
