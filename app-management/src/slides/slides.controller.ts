import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserEntity } from 'src/dynamodb/user.entity';
import PresentationDto from './presentation.dto';
import { PresentationEntity } from 'src/dynamodb/presentation.entity';
import { S3Service } from 'src/dynamodb/s3.service';

@Controller('slides')
@UseGuards(AuthGuard)
export class SlidesController {
  constructor(
    private user: UserEntity,
    private pres: PresentationEntity,
    private s3: S3Service,
  ) {}

  @Get('getUser')
  async createUser() {
    return this.user.add('test@example.com', 'test1');
  }

  @Post('createPresentation')
  async addProject(@Body() presentation: PresentationDto, @Req() req: any) {
    const id = Buffer.from(
      `${presentation.projectId}${new Date().toISOString()}`,
    ).toString('base64');

    const s3Folder = this.s3.generateFolder(id);

    await this.s3.create(presentation, s3Folder.folder);

    return this.pres.create(presentation, req.user.sub, id, s3Folder.s3Loc);
  }
}
