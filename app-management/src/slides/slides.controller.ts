import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { AuthGuard } from 'src/auth/auth.guard';
import PresentationDto from './presentation.dto';
import { PresentationEntity } from 'src/dynamodb/presentation.entity';
import { S3Service } from 'src/dynamodb/s3.service';

@Controller('slides')
@UseGuards(AuthGuard)
export class SlidesController {
  constructor(private pres: PresentationEntity, private s3: S3Service) {}

  @Post('createPresentation')
  async createPresentation(@Body() data: PresentationDto, @Req() req: any) {
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
}
