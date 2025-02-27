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

@Controller('videos')
@UseGuards(AuthGuard)
export class VideoController {
  constructor(
    private readonly fireStore: FirestoreService,
    private readonly gemini: GeminiService,
    private readonly sharedService: SharedService,
    private readonly s3: S3Service,
  ) {}

  @Get('/fix')
  async fixCollection() {
    await this.fireStore.fixCreatedAtAndUpdatedAt('video');
    return 'done';
  }

  // create a video
  @Post('/')
  async createVideo(@Body() data: any, @Req() req: any) {
    // convert properties to object
    const obj = {};
    if (data.properties) {
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
  updateVideo(@Param('id') id: string, @Body() data: any) {
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
    @Body() data: any,
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
    @Body() data: { newPosition: number },
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
    @Body('s3Key') s3Key: string,
    @Body('dbKey') dbKey: string,
    @Body('keyToCompare') keyToCompare: string,
    @Res() res: any,
  ) {
    const video = await this.fireStore.get<IVideo>('video', id);
    const allowedDBKeys = ['artifacts', 'generatedVideoInfo'];
    const allowedPropertyToCompare = ['cloudFile', 's3Key'];
    dbKey = allowedDBKeys.includes(dbKey) ? dbKey : 'artifacts';
    keyToCompare = allowedPropertyToCompare.includes(keyToCompare)
      ? keyToCompare
      : 's3Key';
    video[dbKey] = video?.[dbKey]?.filter(
      (_item) => _item[keyToCompare] !== s3Key,
    );

    await this.fireStore.update('video', id, { [dbKey]: video[dbKey] });
    await this.s3.delete(s3Key);

    res.status(200).json({
      message: `Artifact ${s3Key} deleted`,
      s3Key,
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

  @Get('project/:projectId')
  async getVideosForProject(
    @Req() req: any,
    @Param('projectId') projectId: string,
  ) {
    return this.fireStore.listByFields('video', [
      { field: 'userId', value: req.user.sub },
      { field: 'isDeleted', value: false },
      { field: 'projectId', value: projectId },
    ]);
  }
}
