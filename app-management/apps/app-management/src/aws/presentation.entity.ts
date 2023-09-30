import { Injectable } from '@nestjs/common';
import { DynamodbClientService } from './dynamodb.service';
import PresentationCreateDto from '@apps/app-management/slides/slides.dto';
import PresentationModel from '@apps/app-management/models/presentation.model';
import { IPresentation } from '@apps/app-management/types';

@Injectable()
export class PresentationEntity {
  private tableName = 'presentations';

  constructor(private db: DynamodbClientService) {}

  create(
    pres: PresentationCreateDto,
    userId: string,
    id: string,
    s3FileName: string,
  ) {
    const presentation = new PresentationModel(
      id,
      userId,
      pres.name,
      pres.projectId,
      s3FileName,
      '',
    );

    return this.db.send(presentation.toDynamoDbPutCommand());
  }

  list(projectId: string) {
    const query = PresentationModel.toQuery(projectId);
    return this.db.send(query);
  }

  updateAuidoStatus(pres: IPresentation): Promise<any> {
    const command = PresentationModel.toUpdateAudioGenerated(pres);
    return this.db.send(command);
  }

  getItem(pid: string, updateAt: number): Promise<any> {
    return this.db.send(PresentationModel.getItem(pid, updateAt));
  }

  updateAudioMergeStatus(
    projectId: string,
    updatedAt: number,
    s3File: string,
    isMerged?: boolean,
  ) {
    const command = PresentationModel.toUpdateAudioMerge({
      projectId,
      updatedAt,
      s3AudioMergedFile: s3File,
      isAudioMerged: isMerged,
    });

    return this.db.send(command);
  }

  updateVideoGeneratedStatus(
    projectId: string,
    updatedAt: number,
    s3File: string,
    isGenerated?: boolean,
  ) {
    const command = PresentationModel.toUpdateVideoGenerated({
      projectId,
      updatedAt,
      s3VideoFile: s3File,
      isVideoGenerated: isGenerated,
    });

    return this.db.send(command);
  }
}
