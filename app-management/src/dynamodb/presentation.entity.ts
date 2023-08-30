import { Injectable } from '@nestjs/common';
import { DynamodbClientService } from './client.service';
import PresentationDto from 'src/slides/presentation.dto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

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
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        id: id,
        name: pres.titleEn,
        projectId: pres.projectId,
        userId,
        s3_file: s3FileName,
        s3_meta_file: '',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });

    return this.db.send(command);
  }
}
