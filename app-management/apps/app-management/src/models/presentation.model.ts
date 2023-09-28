import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import { IPresentation } from '@apps/app-management/types';
import { PRESENTATION_TABLE_NAME } from '@apps/app-management/constants';

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

  public static toQuery(projectId: string, limit = 10): any {
    const command = new QueryCommand({
      TableName: PresentationModel.tableName,
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId,
      },
    });

    return command;
  }

  public static toUpdateAudioGenerated(pres: IPresentation) {
    const command = new UpdateItemCommand({
      TableName: PresentationModel.tableName,
      Key: marshall({
        projectId: pres.projectId,
        updatedAt: pres.updatedAt,
      }),
      UpdateExpression: 'SET s3MetaFile = :val1, isAudioGenerate = :val2',
      ExpressionAttributeValues: marshall({
        ':val1': pres.s3MetaFile,
        ':val2': pres.isAudioGenerate,
      }),
      ReturnValues: 'ALL_NEW',
    });

    return command;
  }

  public static getItem(pid: string, updatedAt: number) {
    const command = new GetItemCommand({
      TableName: PresentationModel.tableName,
      Key: marshall({
        projectId: pid,
        updatedAt: Number(updatedAt),
      }),
    });

    return command;
  }
}

export default PresentationModel;
