import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { ELanguage, IArtifacts, IScenes, IVideo } from '@app/shared/types';
import { GeminiService } from '@app/shared/gcp/gemini.service';
import { SharedService } from '@app/shared/shared.service';
import { IProject } from '@apps/app-management/types';
import { S3Service } from '@app/shared/aws/s3.service';
import { Request } from 'express';
import { S3_ARTIFACTS_FOLDER } from '@apps/app-management/constants';
import { GitHubService } from '@app/shared/github/github.service';
import {
  CreateVideoDto,
  UpdateVideoDto,
  DeleteArtifactDto,
  YoutubeUploadDto,
  UpdateScenesDto,
  ChangeScenePositionDto,
  CreateVideoWithScenesDto,
} from './dto';
import { getLayoutContent, getDefaultAsset } from './layouts.helper';

@Controller('videos')
@UseGuards(AuthGuard)
export class VideoController {
  constructor(
    private readonly fireStore: FirestoreService,
    private readonly gemini: GeminiService,
    private readonly sharedService: SharedService,
    private readonly s3: S3Service,
    private readonly github: GitHubService,
  ) {}

  @Get('/fix')
  async fixCollection() {
    await this.fireStore.fixCreatedAtAndUpdatedAt('video');
    return 'done';
  }

  // create a video
  @Post('/')
  async createVideo(@Body() data: CreateVideoDto, @Req() req: any) {
    // convert properties to object
    const obj = {};
    if (data.properties) {
      /**
       * @Optional
       * Custom DB properties
       */
      const pairs = data.properties.split('\n');

      pairs.forEach((pair) => {
        const [key, value] = pair.split('=');
        obj[key] = value;
      });
      delete data.properties;
    }

    const video = await this.fireStore.add('video', {
      ...data,
      ...obj,
      isDeleted: false,
      userId: req.user.sub,
    });

    // Create a scenes sub collection for the video
    const scenes = await this.fireStore.add(`video/${video.id}/scenes`, {
      videoId: video.id,
      scenes: [],
    });

    return this.fireStore.update('video', video.id, { scenesId: scenes.id });
  }

  // Create a video with scenes in one request
  @Post('/create-with-scenes')
  async createVideoWithScenes(
    @Body() data: CreateVideoWithScenesDto,
    @Req() req: any,
  ) {
    // First fetch the project to get its settings
    const project = await this.fireStore.get<IProject>(
      'project',
      data.projectId,
    );
    if (!project) {
      throw new Error(`Project with ID ${data.projectId} not found`);
    }

    // Prepare assets and layout information upfront
    const layoutId = data.layoutId || project.defaultLayout || '';
    const assets = data.defaultAsset
      ? [data.defaultAsset]
      : project.assets || [];

    // Get the default asset for this layout type once
    const defaultAsset =
      assets.length > 0
        ? getDefaultAsset(layoutId, project.sceneRandomAsset || false, assets)
        : '';

    // Create the video first
    const videoData = {
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      audioLanguage: data.audioLanguage || project.defaultLanguage,
      voiceCode: data.voiceCode || project.defaultVoice,
      backgroundMusic: data.backgroundMusic || project.defaultBackgroundMusic,
      defaultAsset: defaultAsset || data.defaultAsset, // Set the selected asset as default
      isDeleted: false,
      userId: req.user.sub,
    };

    // Add any custom properties if provided
    if (data.properties) {
      const obj = {};
      const pairs = data.properties.split('\n');

      pairs.forEach((pair) => {
        const [key, value] = pair.split('=');
        obj[key] = value;
      });

      Object.assign(videoData, obj);
    }

    // Create the video in the database
    const video = await this.fireStore.add('video', videoData);

    // Create empty scenes collection for the video
    const scenes = await this.fireStore.add(`video/${video.id}/scenes`, {
      videoId: video.id,
      scenes: [],
    });

    // Update the video with the scenes ID
    await this.fireStore.update('video', video.id, { scenesId: scenes.id });

    // If scene descriptions are provided, create scenes
    if (
      data.sceneDescriptions &&
      data.sceneDescriptions.length > 0 &&
      layoutId
    ) {
      // Prepare the base content structure once
      const baseContent = getLayoutContent(layoutId, defaultAsset);

      // Prepare scenes data based on the scene descriptions
      const scenesData = data.sceneDescriptions.map((description) => {
        // Clone the base content for this scene and customize it
        const content =
          data.sceneContent || JSON.parse(JSON.stringify(baseContent));

        // Apply description to title field if applicable
        if (content && content.title) {
          content.title.value = description;
        }

        // Create the scene object
        return {
          id: uuid(),
          description,
          layoutId,
          content,
          image: defaultAsset, // Use the already selected asset for all scenes
        };
      });

      // Update the scenes with the prepared data
      await this.fireStore.updateScene(
        `video/${video.id}/scenes`,
        scenes.id,
        scenesData,
      );
    }

    return this.fireStore.get('video', video.id);
  }

  // Delete a video
  @Delete('/:id')
  async deleteVideo(@Param('id') id: string) {
    // TODO: add deleted at time to the video
    await this.fireStore.update('video', id, { isDeleted: true });
    const video = await this.fireStore.get<IVideo>('video', id);
    const project = await this.fireStore.get<IProject>(
      'project',
      video.projectId,
    );
    const scenes = await this.fireStore.list<IScenes>(`video/${id}/scenes`);
    const generatedVideoAssets = video?.generatedVideoInfo.map(
      (_asset) => _asset.cloudFile,
    );

    // Check and add thumbnail to the assets
    if (video?.thumbnailUrl) {
      generatedVideoAssets.push(video.thumbnailUrl);
    }
    await this.sharedService.deleteS3Assets(
      scenes[0] || '',
      project.assets,
      generatedVideoAssets,
    );
    return video;
  }

  // Get all videos
  @Get('/')
  getVideos(@Req() req: any) {
    return this.fireStore.listByFields('video', [
      { field: 'userId', value: req.user.sub },
    ]);
  }

  // Get video by id
  @Get('/:id')
  getVideo(@Param('id') id: string) {
    return this.fireStore.get('video', id);
  }

  // Update video by id
  @Put('/:id')
  updateVideo(@Param('id') id: string, @Body() data: UpdateVideoDto) {
    return this.fireStore.update('video', id, data);
  }

  /**
   * @Deprecated - Use updateScene instead
   * @param id
   * @param data
   */
  @Post('/:id/scenes')
  createScene(@Param('id') id: string, @Body() data: any) {
    return this.fireStore.add(`video/${id}/scenes`, data);
  }

  // Update scenes for a video
  // Add new scene to scenes array
  @Put('/:id/scenes/:sceneId/:sceneArrayIndex?')
  updateScene(
    @Param('id') id: string,
    @Param('sceneId') sceneId: string,
    @Param('sceneArrayIndex') sceneArrayIndex: string,
    @Query('addAfter') addAfter: boolean,
    @Body() data: UpdateScenesDto,
  ) {
    if (data?.scenes && Array.isArray(data.scenes)) {
      return this.fireStore.updateScene(
        `video/${id}/scenes`,
        sceneId,
        data?.scenes,
      );
    } else {
      return this.fireStore.updateScene(
        `video/${id}/scenes`,
        sceneId,
        data,
        sceneArrayIndex,
        addAfter,
      );
    }
  }

  // Delete a scene
  @Delete('/:id/scenes/:sceneId/:sceneArrayIndex')
  deleteScene(
    @Param('id') id: string,
    @Param('sceneId') sceneId: string,
    @Param('sceneArrayIndex') sceneArrayIndex: number,
  ) {
    return this.fireStore.deleteScene(
      `video/${id}/scenes`,
      sceneId,
      sceneArrayIndex,
    );
  }

  // Change scene position
  @Put('/:id/scenes/:sceneId/:sceneArrayIndex/reorder')
  updateScenePosition(
    @Param('id') id: string,
    @Param('sceneId') sceneId: string,
    @Param('sceneArrayIndex') sceneArrayIndex: number,
    @Body() data: ChangeScenePositionDto,
  ) {
    return this.fireStore.changeScenePosition(
      `video/${id}/scenes`,
      sceneId,
      sceneArrayIndex,
      data.newPosition,
    );
  }

  // Get scenes for a video
  @Get('/:id/scenes')
  getScenes(@Param('id') id: string) {
    return this.fireStore.list(`video/${id}/scenes`);
  }

  // Get scene by id
  @Get('/:id/scenes/:sceneId')
  getScene(@Param('id') id: string, @Param('sceneId') sceneId: string) {
    return this.fireStore.get(`video/${id}/scenes`, sceneId);
  }

  @Post('/:id/artifact')
  async createArtifact(
    @Param('id') id: string,
    @Query('name') name: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: any,
  ) {
    // Using this rawbody https://docs.nestjs.com/faq/raw-body docs to get the raw body
    const s3Key = `${S3_ARTIFACTS_FOLDER}/${id}/${uuid()}.txt`;
    const rawbody = req.rawBody;
    await this.s3.createTextFileInMemoryAndSaveToS3(s3Key, rawbody.toString());

    const video = await this.fireStore.get<IVideo>('video', id);
    const artifacts: IArtifacts[] = video?.artifacts || [];
    artifacts.push({ name, s3Key });

    await this.fireStore.update('video', id, { artifacts: artifacts });
    res.status(201).json({
      message: `Artifact ${s3Key} created`,
      s3Key,
      videoId: id,
    });
  }

  @Delete('/:id/artifact')
  async deleteArtifact(
    @Param('id') id: string,
    @Body() deleteArtifactDto: DeleteArtifactDto,
    @Res() res: any,
  ) {
    const video = await this.fireStore.get<IVideo>('video', id);
    const allowedDBKeys = ['artifacts', 'generatedVideoInfo'];
    const allowedPropertyToCompare = ['cloudFile', 's3Key'];
    const dbKey = allowedDBKeys.includes(deleteArtifactDto.dbKey)
      ? deleteArtifactDto.dbKey
      : 'artifacts';
    const keyToCompare = allowedPropertyToCompare.includes(
      deleteArtifactDto.keyToCompare,
    )
      ? deleteArtifactDto.keyToCompare
      : 's3Key';
    video[dbKey] = video?.[dbKey]?.filter(
      (_item) => _item[keyToCompare] !== deleteArtifactDto.s3Key,
    );

    await this.fireStore.update('video', id, { [dbKey]: video[dbKey] });
    await this.s3.delete(deleteArtifactDto.s3Key);

    res.status(200).json({
      message: `Artifact ${deleteArtifactDto.s3Key} deleted`,
      s3Key: deleteArtifactDto.s3Key,
    });
  }

  // copy a video and its scenes
  @Post('/:id/copy')
  async copyVideo(
    @Param('id') id: string,
    @Query('langFrom') langFrom: ELanguage,
    @Query('langTo') langTo: ELanguage,
    @Req() req: any,
  ) {
    const video = await this.fireStore.get<IVideo>('video', id);
    const scenesDocs = await this.fireStore.list<IScenes>(`video/${id}/scenes`);

    const newVideo = await this.fireStore.add('video', {
      ...video,
      name: `${video.name} - ${langTo}- Copy`,
      generatedVideoInfo: [],
      userId: req.user.sub,
    });

    const scenes = langTo
      ? await this.gemini.translateScenes(
          scenesDocs[0].scenes,
          langFrom,
          langTo,
        )
      : scenesDocs[0].scenes;
    const newScenes = await this.fireStore.add(`video/${newVideo.id}/scenes`, {
      videoId: newVideo.id,
      scenes: scenes.map((scene: any) => ({ ...scene, id: uuid() })),
    });

    return this.fireStore.update('video', newVideo.id, {
      scenesId: newScenes.id,
      audioLanguage: langTo,
    });
  }

  // Upload video to youtube
  @Post('/:id/upload')
  async uploadToYoutube(
    @Param('id') id: string,
    @Body() data: YoutubeUploadDto,
    @Res() res: any,
  ) {
    const video = await this.fireStore.get<IVideo>('video', id);
    const s3DownloadKey = video.generatedVideoInfo?.pop()?.cloudFile;
    const errors = [];
    // TODO: this validation can be done at framework level.
    if (!data.branch) {
      errors.push('Branch is required');
    }
    if (!data.title) {
      errors.push('Title is required');
    }
    if (!data.desc) {
      errors.push('Description is required');
    }
    if (!video?.thumbnailUrl) {
      errors.push('Thumbnail is not uploaded');
    }

    if (!s3DownloadKey) {
      errors.push('Video is not generated yet');
    }

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const videoSignedDownloadUrl = await this.s3.getSignedUrlForDownload(
      s3DownloadKey,
    );

    try {
      await this.github.triggerWorkflow(
        'naveedshahzad',
        'allchannels',
        'workflow_dispatch.yml',
        'main',
        {
          branch_name: data.branch,
          title: data.title,
          desc: data.desc,
          thumbnail_url: video.thumbnailUrl || '',
          video_url: videoSignedDownloadUrl,
          video_id: video.id,
        },
      );
      return res
        .status(201)
        .json({ message: 'Video uploaded to YouTube successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading video to youtube' });
    }
  }

  @Get('project/:projectId')
  async getVideosForProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    return this.fireStore.listByFields('video', [
      // TODO: validate user access to the project
      // API Key access to the project
      { field: 'isDeleted', value: false },
      { field: 'projectId', value: projectId },
    ]);
  }
}
