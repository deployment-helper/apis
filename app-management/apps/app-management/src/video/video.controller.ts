import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { FirestoreService } from '@app/shared/gcp/firestore.service';

@Controller('videos')
@UseGuards(AuthGuard)
export class VideoController {
  constructor(private readonly fireStore: FirestoreService) {}

  @Post('/')
  createVideo() {
    return this.fireStore.add('video', { name: 'test' });
  }

  @Get('/')
  getVideos() {
    return this.fireStore.list('video');
  }

  // Get video by id
  @Get('/:id')
  getVideo(@Param('id') id: string) {
    return this.fireStore.get('video', id);
  }

  // Update video by id
  @Post('/:id')
  updateVideo(@Param('id') id: string, @Body() data: any) {
    return this.fireStore.update('video', id, data);
  }
}
