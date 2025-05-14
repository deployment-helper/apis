import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '@apps/app-management/aws/aws.module';
import { GcpModule } from '@app/shared/gcp/gcp.module';
import { AwsModule as SharedAwsModule } from '@app/shared/aws/aws.module';
import { FsService } from '@app/shared/fs/fs.service';
import { SharedService } from '@app/shared/shared.service';
import { GitHubService } from '@app/shared/github/github.service';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { GeminiService } from '@app/shared/gcp/gemini.service';
import { S3Service } from '@app/shared/aws/s3.service';
import { ELanguage } from '@app/shared/types';

describe('VideoController', () => {
  let controller: VideoController;
  let fireStore: any;
  let gemini: any;
  let sharedService: any;
  let s3: any;
  let github: any;

  beforeEach(async () => {
    fireStore = {
      add: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
      listByFields: jest.fn(),
      updateScene: jest.fn(),
      deleteScene: jest.fn(),
      changeScenePosition: jest.fn(),
      fixCreatedAtAndUpdatedAt: jest.fn(),
    };
    gemini = { translateScenes: jest.fn() };
    sharedService = { deleteS3Assets: jest.fn() };
    s3 = {
      createTextFileInMemoryAndSaveToS3: jest.fn(),
      getSignedUrlForDownload: jest.fn(),
      delete: jest.fn(),
    };
    github = { triggerWorkflow: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        { provide: FsService, useValue: {} },
        { provide: SharedService, useValue: sharedService },
        { provide: GitHubService, useValue: github },
        { provide: 'FirestoreService', useValue: fireStore },
        { provide: 'GeminiService', useValue: gemini },
        { provide: 'S3Service', useValue: s3 },
      ],
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AwsModule,
        GcpModule,
        SharedAwsModule,
      ],
    })
      .overrideProvider(FirestoreService)
      .useValue(fireStore)
      .overrideProvider(GeminiService)
      .useValue(gemini)
      .overrideProvider(S3Service)
      .useValue(s3)
      .compile();

    controller = module.get<VideoController>(VideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVideos', () => {
    it('should call fireStore.listByFields with userId', () => {
      const req = { user: { sub: 'user1' } };
      controller.getVideos(req);
      expect(fireStore.listByFields).toHaveBeenCalledWith('video', [
        { field: 'userId', value: 'user1' },
      ]);
    });
  });

  describe('getVideo', () => {
    it('should call fireStore.get with id', () => {
      controller.getVideo('vid1');
      expect(fireStore.get).toHaveBeenCalledWith('video', 'vid1');
    });
  });

  describe('createVideoWithScenes', () => {
    it('should create a video with scenes', async () => {
      // Mock data
      const projectData = {
        id: 'project1',
        defaultLayout: 'layout1',
        sceneRandomAsset: false,
        assets: ['asset1', 'asset2'],
        defaultLanguage: 'en',
        defaultVoice: 'voice1',
        defaultBackgroundMusic: 'music1',
      };
      const requestData = {
        projectId: 'project1',
        name: 'Test Video',
        description: 'Test Description',
        layoutId: 'layout1',
        raw: ['Scene 1', 'Scene 2'],
      };
      const mockVideo = { id: 'video1' };
      const mockScenes = { id: 'scenes1' };
      const mockReq = { user: { sub: 'user1' } };
      const mockLayoutContent = { title: { value: '' } };

      // Setup mocks
      fireStore.get.mockResolvedValue(projectData);
      fireStore.add.mockResolvedValueOnce(mockVideo).mockResolvedValueOnce(mockScenes);
      jest.mock('./layouts.helper', () => ({
        getLayoutContent: jest.fn(() => mockLayoutContent),
      }));
      
      // Execute
      await controller.createVideoWithScenes(requestData as any, mockReq);
      
      // Verify
      expect(fireStore.get).toHaveBeenCalledWith('project', 'project1');
      expect(fireStore.add).toHaveBeenCalledWith('video', expect.objectContaining({
        name: 'Test Video',
        description: 'Test Description',
        projectId: 'project1',
        userId: 'user1',
      }));
      expect(fireStore.add).toHaveBeenCalledWith(`video/${mockVideo.id}/scenes`, expect.objectContaining({
        videoId: mockVideo.id,
        scenes: [],
      }));
      expect(fireStore.update).toHaveBeenCalledWith('video', mockVideo.id, { scenesId: mockScenes.id });
      expect(fireStore.updateScene).toHaveBeenCalled();
    });
    
    it('should throw error if project not found', async () => {
      fireStore.get.mockResolvedValue(null);
      const requestData = { projectId: 'notfound' };
      const mockReq = { user: { sub: 'user1' } };

      await expect(controller.createVideoWithScenes(requestData as any, mockReq))
        .rejects
        .toThrow(`Project with ID notfound not found`);
    });
  });

  describe('updateVideo', () => {
    it('should call fireStore.update with id and data', () => {
      controller.updateVideo('vid1', { name: 'new' } as any);
      expect(fireStore.update).toHaveBeenCalledWith('video', 'vid1', { name: 'new' });
    });
  });

  describe('createScene', () => {
    it('should call fireStore.add for scenes', () => {
      controller.createScene('vid1', { foo: 'bar' });
      expect(fireStore.add).toHaveBeenCalledWith('video/vid1/scenes', { foo: 'bar' });
    });
  });

  describe('updateScene', () => {
    it('should call updateScene with scenes array', () => {
      controller.updateScene('vid1', 'scene1', '0', false, { scenes: [1,2] } as any);
      expect(fireStore.updateScene).toHaveBeenCalledWith('video/vid1/scenes', 'scene1', [1,2]);
    });
    it('should call updateScene with data', () => {
      controller.updateScene('vid1', 'scene1', '0', false, { foo: 'bar' } as any);
      expect(fireStore.updateScene).toHaveBeenCalledWith('video/vid1/scenes', 'scene1', { foo: 'bar' }, '0', false);
    });
  });

  describe('deleteScene', () => {
    it('should call deleteScene', () => {
      controller.deleteScene('vid1', 'scene1', 0);
      expect(fireStore.deleteScene).toHaveBeenCalledWith('video/vid1/scenes', 'scene1', 0);
    });
  });

  describe('updateScenePosition', () => {
    it('should call changeScenePosition', () => {
      controller.updateScenePosition('vid1', 'scene1', 0, { newPosition: 2 });
      expect(fireStore.changeScenePosition).toHaveBeenCalledWith('video/vid1/scenes', 'scene1', 0, 2);
    });
  });

  describe('getScenes', () => {
    it('should call list for scenes', () => {
      controller.getScenes('vid1');
      expect(fireStore.list).toHaveBeenCalledWith('video/vid1/scenes');
    });
  });

  describe('getScene', () => {
    it('should call get for scene', () => {
      controller.getScene('vid1', 'scene1');
      expect(fireStore.get).toHaveBeenCalledWith('video/vid1/scenes', 'scene1');
    });
  });

  describe('getVideosForProject', () => {
    it('should call listByFields for project', async () => {
      await controller.getVideosForProject({} as any, 'proj1');
      expect(fireStore.listByFields).toHaveBeenCalledWith('video', [
        { field: 'isDeleted', value: false },
        { field: 'projectId', value: 'proj1' },
      ]);
    });
  });

  describe('createVideo', () => {
    it('should create a video and scenes collection', async () => {
      // Mock data
      const videoData = {
        name: 'Test Video',
        description: 'Test Description',
        projectId: 'project1',
        properties: 'prop1=value1\nprop2=value2',
      };
      const mockVideo = { id: 'video1' };
      const mockScenes = { id: 'scenes1' };
      const mockReq = { user: { sub: 'user1' } };

      // Setup mocks
      fireStore.add.mockResolvedValueOnce(mockVideo).mockResolvedValueOnce(mockScenes);
      
      // Execute
      await controller.createVideo(videoData as any, mockReq);
      
      // Verify
      expect(fireStore.add).toHaveBeenCalledWith('video', expect.objectContaining({
        name: 'Test Video',
        description: 'Test Description',
        projectId: 'project1',
        userId: 'user1',
        prop1: 'value1',
        prop2: 'value2',
        isDeleted: false,
      }));
      expect(fireStore.add).toHaveBeenCalledWith(`video/${mockVideo.id}/scenes`, {
        videoId: mockVideo.id,
        scenes: [],
      });
      expect(fireStore.update).toHaveBeenCalledWith('video', mockVideo.id, { scenesId: mockScenes.id });
    });
  });

  describe('deleteVideo', () => {
    it('should mark video as deleted and delete S3 assets', async () => {
      // Mock data
      const videoId = 'video1';
      const mockVideo = { 
        id: videoId, 
        projectId: 'proj1',
        thumbnailUrl: 'thumb.jpg',
        generatedVideoInfo: [
          { cloudFile: 'video1.mp4' },
          { cloudFile: 'video2.mp4' },
        ],
      };
      const mockProject = {
        id: 'proj1',
        assets: ['asset1.jpg', 'asset2.jpg'],
      };
      const mockScenes = [{ id: 'scene1' }];

      // Setup mocks
      fireStore.update.mockResolvedValue({});
      fireStore.get.mockResolvedValueOnce(mockVideo).mockResolvedValueOnce(mockProject);
      fireStore.list.mockResolvedValue(mockScenes);
      
      // Execute
      await controller.deleteVideo(videoId);
      
      // Verify
      expect(fireStore.update).toHaveBeenCalledWith('video', videoId, { isDeleted: true });
      expect(fireStore.get).toHaveBeenCalledWith('video', videoId);
      expect(fireStore.get).toHaveBeenCalledWith('project', 'proj1');
      expect(fireStore.list).toHaveBeenCalledWith(`video/${videoId}/scenes`);
      expect(sharedService.deleteS3Assets).toHaveBeenCalledWith(
        mockScenes[0], 
        mockProject.assets, 
        ['video1.mp4', 'video2.mp4', 'thumb.jpg']
      );
    });
  });

  describe('copyVideo', () => {
    it('should copy video and translate scenes if language provided', async () => {
      // Mock data
      const videoId = 'video1';
      const mockVideo = { 
        id: videoId,
        name: 'Original Video',
        projectId: 'proj1',
      };
      const mockScenesDocs = [{ scenes: [{ id: 'scene1', text: 'Hello' }] }];
      const mockNewVideo = { id: 'newVideo1' };
      const mockNewScenes = { id: 'newScenes1' };
      const mockTranslatedScenes = [{ id: 'scene1', text: 'Hola' }];
      const mockReq = { user: { sub: 'user1' } };

      // Setup mocks
      fireStore.get.mockResolvedValue(mockVideo);
      fireStore.list.mockResolvedValue(mockScenesDocs);
      fireStore.add.mockResolvedValueOnce(mockNewVideo).mockResolvedValueOnce(mockNewScenes);
      gemini.translateScenes.mockResolvedValue(mockTranslatedScenes);
      
      // Execute
      await controller.copyVideo(videoId, ELanguage['Spanish (Spain)'], ELanguage['English (Australia)'], mockReq);
      
      // Verify
      expect(fireStore.get).toHaveBeenCalledWith('video', videoId);
      expect(fireStore.list).toHaveBeenCalledWith(`video/${videoId}/scenes`);
      expect(gemini.translateScenes).toHaveBeenCalledWith(mockScenesDocs[0].scenes, ELanguage['Spanish (Spain)'], ELanguage['English (Australia)']);
      expect(fireStore.add).toHaveBeenCalledWith('video', expect.objectContaining({
        name: 'Original Video - en-AU- Copy',
        generatedVideoInfo: [],
        userId: 'user1',
      }));
      expect(fireStore.add).toHaveBeenCalledWith(`video/${mockNewVideo.id}/scenes`, {
        videoId: mockNewVideo.id,
        scenes: expect.any(Array),
      });
      expect(fireStore.update).toHaveBeenCalledWith('video', mockNewVideo.id, {
        scenesId: mockNewScenes.id,
        audioLanguage: 'en-AU',
      });
    });
  });

  describe('uploadToYoutube', () => {
    it('should upload video to youtube and mark as published', async () => {
      // Mock data
      const videoId = 'video1';
      const mockVideo = { 
        id: videoId,
        thumbnailUrl: 'thumbnail.jpg',
        generatedVideoInfo: [{ cloudFile: 'video.mp4' }],
      };
      const mockData = {
        branch: 'main',
        title: 'My Video',
        desc: 'Video description',
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockSignedUrl = 'https://signed-url.com/video.mp4';

      // Setup mocks
      fireStore.get.mockResolvedValue(mockVideo);
      s3.getSignedUrlForDownload.mockResolvedValue(mockSignedUrl);
      github.triggerWorkflow.mockResolvedValue({});
      
      // Execute
      await controller.uploadToYoutube(videoId, mockData as any, mockRes);
      
      // Verify
      expect(fireStore.get).toHaveBeenCalledWith('video', videoId);
      expect(s3.getSignedUrlForDownload).toHaveBeenCalledWith('video.mp4');
      expect(github.triggerWorkflow).toHaveBeenCalledWith(
        'naveedshahzad',
        'allchannels',
        'workflow_dispatch.yml',
        'main',
        expect.objectContaining({
          branch_name: 'main',
          title: 'My Video',
          desc: 'Video description',
          thumbnail_url: 'thumbnail.jpg',
          video_url: mockSignedUrl,
          video_id: videoId,
        })
      );
      expect(fireStore.update).toHaveBeenCalledWith('video', videoId, {
        status: 'published',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Video uploaded to YouTube successfully'
      }));
    });

    it('should return errors when validation fails', async () => {
      // Mock data
      const videoId = 'video1';
      const mockVideo = { id: videoId };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Setup mocks
      fireStore.get.mockResolvedValue(mockVideo);
      
      // Execute
      await controller.uploadToYoutube(videoId, {} as any, mockRes);
      
      // Verify
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          'Branch is required',
          'Title is required',
          'Description is required',
          'Thumbnail is not uploaded',
          'Video is not generated yet'
        ])
      }));
    });
  });

  describe('createArtifact', () => {
    it('should create an artifact and save to S3', async () => {
      // Mock data
      const videoId = 'video1';
      const name = 'artifact1';
      const mockVideo = { 
        id: videoId,
        artifacts: [] 
      };
      const mockReq = {
        rawBody: Buffer.from('test content')
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Setup mocks
      fireStore.get.mockResolvedValue(mockVideo);
      s3.createTextFileInMemoryAndSaveToS3.mockResolvedValue(true);
      
      // Execute
      await controller.createArtifact(videoId, name, mockReq as any, mockRes);
      
      // Verify
      expect(s3.createTextFileInMemoryAndSaveToS3).toHaveBeenCalledWith(
        expect.stringContaining(videoId),
        'test content'
      );
      expect(fireStore.update).toHaveBeenCalledWith('video', videoId, { 
        artifacts: [expect.objectContaining({ name })] 
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('deleteArtifact', () => {
    it('should delete an artifact from S3 and update video', async () => {
      // Mock data
      const videoId = 'video1';
      const s3Key = 'artifacts/video1/file.txt';
      const mockVideo = { 
        id: videoId,
        artifacts: [
          { s3Key: 'other-key', name: 'other' },
          { s3Key, name: 'test' }
        ]
      };
      const mockReq = { body: { s3Key, dbKey: 'artifacts', keyToCompare: 's3Key' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Setup mocks
      fireStore.get.mockResolvedValue(mockVideo);
      s3.delete.mockResolvedValue(true);
      
      // Execute
      await controller.deleteArtifact(videoId, mockReq.body, mockRes);
      
      // Verify
      expect(fireStore.update).toHaveBeenCalledWith('video', videoId, { 
        artifacts: [{ s3Key: 'other-key', name: 'other' }]
      });
      expect(s3.delete).toHaveBeenCalledWith(s3Key);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
