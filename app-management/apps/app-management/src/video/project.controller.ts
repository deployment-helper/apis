import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { FirestoreService } from '@app/shared/gcp/firestore.service';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly firestoreService: FirestoreService) {}
  @Post()
  // project_name: string
  createProject(@Body() data: { projectName: string }, @Req() req: any) {
    return this.firestoreService.add('project', {
      ...data,
      userId: req.user.sub,
    });
  }

  @Get()
  async getProjects(@Req() req: any) {
    return this.firestoreService.listByField('project', 'userId', req.user.sub);
  }
}
