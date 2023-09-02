import { Injectable } from '@nestjs/common';
import { DynamodbClientService } from './client.service';
import PresentationDto from 'src/slides/presentation.dto';
import PresentationModel from 'src/models/presentation.model';

@Injectable()
export class PresentationEntity {
  private tableName = 'presentations';

  constructor(private db: DynamodbClientService) {}

  create(
    pres: PresentationDto,
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
}
