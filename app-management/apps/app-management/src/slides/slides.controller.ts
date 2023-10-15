import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import PresentationCreateDto, {
  PresentationUpdateDto,
  IVideoMetaData,
} from './slides.dto';
import { PresentationEntity } from '@apps/app-management/aws/presentation.entity';
import { S3Service } from '@apps/app-management/aws/s3.service';
import { SnsService } from '@apps/app-management/aws/sns.service';
import { S3_VIDEO_META_DATA_FILE_NAME } from '../constants';

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

  @Post('createVideoMetaData')
  @HttpCode(201)
  async createVideoMetaData(@Body() body: IVideoMetaData) {
    await this.s3.create(
      body.data,
      `${body.id}/${S3_VIDEO_META_DATA_FILE_NAME}`,
    );
  }

  @Put('update')
  @HttpCode(201)
  async update(@Body() pres: PresentationUpdateDto) {
    const data = await this.pres.updateAuidoStatus(pres);
    return unmarshall(data.Attributes);
  }

  @Get(':pid')
  @HttpCode(200)
  async slide(
    @Param('pid') pid: string,
    @Query('updatedAt') updatedAt: number,
  ) {
    const data = await this.pres.getItem(pid, updatedAt);
    const item = unmarshall(data.Item);
    const s3File = await this.s3.get(item.s3File);
    const s3MetaFile = await this.s3.get(item.s3MetaFile);

    return {
      item,
      s3File,
      s3MetaFile,
    };
  }
}
