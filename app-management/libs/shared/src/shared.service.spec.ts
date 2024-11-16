import { Test, TestingModule } from '@nestjs/testing';
import { SharedService } from './shared.service';
import { ServerNames } from '@app/shared/types';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '@app/shared/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';

describe('SharedService', () => {
  let service: SharedService;

  beforeEach(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn(() => 'devkey'), // Mock the get method
    } as unknown as ConfigService;

    const s3ServiceMock = {
      deleteAll: jest.fn((urls) => urls),
    } as unknown as S3Service;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: S3Service,
          useValue: s3ServiceMock,
        },
        FsService,
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

  describe('deleteVideoAssets', () => {
    it('should return S3 URLs not in project assets', async () => {
      const video = {
        content:
          'https://example.s3.amazonaws.com/video1.mp4 https://example.s3.south.amazonaws.com/video2.mp4',
      };
      const projectAssets = ['https://example.s3.amazonaws.com/video1.mp4'];

      const result = await service.deleteS3Assets(video, projectAssets);

      expect(result).toEqual([
        'https://example.s3.south.amazonaws.com/video2.mp4',
      ]);
    });

    it('should return empty array if no S3 URLs are found', async () => {
      const video = {
        content: 'No S3 URLs here',
      };
      const projectAssets: string[] = [];

      const result = await service.deleteS3Assets(video, projectAssets);

      expect(result).toEqual([]);
    });

    it('should return all S3 URLs if none are in project assets', async () => {
      const video = {
        content:
          'https://example.s3.south.amazonaws.com/video1.mp4 https://example.s3.south.amazonaws.com/video2.mp4',
      };
      const projectAssets: string[] = [];

      const result = await service.deleteS3Assets(video, projectAssets);

      expect(result).toEqual([
        'https://example.s3.south.amazonaws.com/video1.mp4',
        'https://example.s3.south.amazonaws.com/video2.mp4',
      ]);
    });

    it('should return empty array if all S3 URLs are in project assets', async () => {
      const video = {
        content:
          'https://example.s3.amazonaws.com/video1.mp4 https://example.s3.amazonaws.com/video2.mp4',
      };
      const projectAssets = [
        'https://example.s3.amazonaws.com/video1.mp4',
        'https://example.s3.amazonaws.com/video2.mp4',
      ];

      const result = await service.deleteS3Assets(video, projectAssets);

      expect(result).toEqual([]);
    });
  });
});
