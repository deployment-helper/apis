import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { FirestoreService } from '@app/shared/gcp/firestore.service';
import { ELanguage, IScenes, IVideo } from '@app/shared/types';
import { GeminiService } from '@app/shared/gcp/gemini.service';

@Controller('videos')
@UseGuards(AuthGuard)
export class VideoController {
  constructor(
    private readonly fireStore: FirestoreService,
    private readonly gemini: GeminiService,
  ) {}

  // create a video
  @Post('/')
  async createVideo(@Body() data: any, @Req() req: any) {
    const video = await this.fireStore.add('video', {
      ...data,
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
  deleteVideo(@Param('id') id: string) {
    return this.fireStore.update('video', id, { isDeleted: true });
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
    return this.fireStore.updateScene(
      `video/${id}/scenes`,
      sceneId,
      data,
      sceneArrayIndex,
      addAfter,
    );
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
