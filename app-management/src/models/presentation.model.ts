import { PutCommand } from '@aws-sdk/lib-dynamodb';

import { IPresentation } from 'src/types';
import { PRESENTATION_TABLE_NAME } from 'src/constants';

export class PresentationModel implements IPresentation {
  public static readonly tableName: string = PRESENTATION_TABLE_NAME;
  updatedAt: Date;
  createdAt: Date;

  constructor(
    public id: string,
    public userId: string,
    public name: string,
    public projectId: string,
    public s3File: string,
    public s3MetaFile: string,
  ) {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  toDynamoDbPutCommand() {
    const command = new PutCommand({
      TableName: PresentationModel.tableName,
      Item: {
        id: this.id,
        updatedAt: this.updatedAt.getTime(),
        updatedAtstr: this.updatedAt.toISOString(),
        createdAt: this.createdAt.toISOString(),
        useId: this.userId,
        name: this.name,
        projectId: this.projectId,
        s3File: this.s3File,
        s3MetaFile: this.s3MetaFile,
      },
    });

    return command;
  }
}

export default PresentationModel;
