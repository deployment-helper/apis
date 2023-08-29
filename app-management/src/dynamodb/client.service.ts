import { Injectable } from '@nestjs/common';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamodbClientService {
  private readonly client: DynamoDBClient;
  private readonly docClient: DynamoDBDocumentClient;
  constructor() {
    this.client = new DynamoDBClient({
      region: 'ap-south-1',
    });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  put(params: any) {
    return this.docClient.send(new PutCommand(params));
  }

  send(params: any) {
    return this.docClient.send(params);
  }
}
