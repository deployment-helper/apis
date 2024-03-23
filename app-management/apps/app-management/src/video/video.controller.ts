import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { FirestoreService } from '@app/shared/gcp/firestore.service';

@Controller('videos')
@UseGuards(AuthGuard)
export class VideoController {
  constructor(private readonly fireStore: FirestoreService) {}

  @Post('/')
  async createVideo(@Body() data: any, @Req() req: any) {
    const video = await this.fireStore.add('video', {
      ...data,
      userId: req.user.sub,
    });

    // Create a scenes sub collection for the video
    const scenes = await this.fireStore.add(`video/${video.id}/scenes`, {
      videoId: video.id,
      scenes: [],
    });

    return this.fireStore.update('video', video.id, { scenesId: scenes.id });
  }

  @Get('/')
  getVideos(@Req() req: any) {
    return this.fireStore.listByField('video', 'userId', req.user.sub);
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

  // Create scene for a video
  @Post('/:id/scenes')
  createScene(@Param('id') id: string, @Body() data: any) {
    return this.fireStore.add(`video/${id}/scenes`, data);
  }

  // Update scene for a video
  @Put('/:id/scenes/:sceneId/:sceneArrayIndex?')
  updateScene(
    @Param('id') id: string,
    @Param('sceneId') sceneId: string,
    @Param('sceneArrayIndex') sceneArrayIndex: string,
    @Body() data: any,
  ) {
    return this.fireStore.updateScene(
      `video/${id}/scenes`,
      sceneId,
      data,
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
}
