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
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
} from './dto/project.dto';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly firestoreService: FirestoreService) {}

  @Get('/fix')
  async fixCollection() {
    await this.firestoreService.fixCreatedAtAndUpdatedAt('project');
    return 'done';
  }

  @Post('/')
  createProject(@Body() data: CreateProjectDto, @Req() req: any) {
    return this.firestoreService.add('project', {
      ...data,
      userId: req.user.sub,
    });
  }

  @Get('/')
  async getProjects(@Req() req: any): Promise<any[]> {
    return this.firestoreService.listByFields('project', [
      { field: 'userId', value: req.user.sub },
    ]);
  }

  @Get(':id')
  async getProject(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<ProjectResponseDto> {
    return this.firestoreService.get('project', id);
  }

  @Put(':id')
  async updateProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateProjectDto,
  ) {
    return this.firestoreService.update('project', id, data);
  }
}
