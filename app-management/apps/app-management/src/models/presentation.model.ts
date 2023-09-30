import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import { IPresentation } from '@apps/app-management/types';
import { PRESENTATION_TABLE_NAME } from '@apps/app-management/constants';

export class PresentationModel implements IPresentation {
  public static readonly tableName: string = PRESENTATION_TABLE_NAME;
  updatedAt: number;
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
  }

  toDynamoDbPutCommand() {
    const updateDate = new Date();
    const command = new PutCommand({
      TableName: PresentationModel.tableName,
      Item: {
        id: this.id,
        updatedAt: updateDate.getTime(),
        updatedAtstr: updateDate.toISOString(),
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
      UpdateExpression: 'SET s3MetaFile = :val1, isAudioGenerated = :val2',
      ExpressionAttributeValues: marshall({
        ':val1': pres.s3MetaFile,
        ':val2': pres.isAudioGenerated,
      }),
      ReturnValues: 'ALL_NEW',
    });

    return command;
  }

  public static toUpdateVideoGenerated(pres: Partial<IPresentation>) {
    const command = new UpdateItemCommand({
      TableName: PresentationModel.tableName,
      Key: marshall({
        projectId: pres.projectId,
        updatedAt: pres.updatedAt,
      }),
      UpdateExpression: 'SET s3VideoFile = :val1, isVideoGenerated = :val2',
      ExpressionAttributeValues: marshall({
        ':val1': pres.s3VideoFile,
        ':val2': pres.isVideoGenerated,
      }),
      ReturnValues: 'ALL_NEW',
    });

    return command;
  }

  public static toUpdateAudioMerge(pres: Partial<IPresentation>) {
    const command = new UpdateItemCommand({
      TableName: PresentationModel.tableName,
      Key: marshall({
        projectId: pres.projectId,
        updatedAt: pres.updatedAt,
      }),
      UpdateExpression: 'SET s3AudioMergedFile = :val1, isAudioMerged = :val2',
      ExpressionAttributeValues: marshall({
        ':val1': pres.s3AudioMergedFile,
        ':val2': pres.isAudioMerged,
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
