import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { AuthGuard } from 'src/auth/auth.guard';
import PresentationCreateDto, { PresentationUpdateDto } from './slides.dto';
import { PresentationEntity } from 'src/aws/presentation.entity';
import { S3Service } from 'src/aws/s3.service';
import { SnsService } from 'src/aws/sns.service';

@Controller('slides')
@UseGuards(AuthGuard)
export class SlidesController {
  constructor(
    private pres: PresentationEntity,
    private s3: S3Service,
    private sns: SnsService,
  ) {}

  @Post('create')
  @HttpCode(201)
  async create(@Body() data: PresentationCreateDto, @Req() req: any) {
    const id = uuid();
    const s3Folder = this.s3.generateFolder(id);

    // create S3 file
    await this.s3.create(data.file, s3Folder.folder);
    // create entry in database
    const dbData = await this.pres.create(
      data,
      req.user.sub,
      id,
      s3Folder.s3Loc,
    );

    return dbData;
  }

  @Get('list')
  async list(@Query('projectId') projectId: string) {
    const data = await this.pres.list(projectId);
    return data;
  }

  @Post('generateAudios')
  @HttpCode(201)
  async generateAudios(@Body() message: PresentationUpdateDto) {
    const data = await this.sns.publishMessage(JSON.stringify(message));
    return data;
  }

  @Post('audioStaus')
  async audioStatus() {
    return 'pending';
  }
}
