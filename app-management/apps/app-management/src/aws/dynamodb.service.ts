import { Injectable } from '@nestjs/common';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * This dynamodb service is not in use needs to be removed.
 */
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

  send(params: any) {
    return this.docClient.send(params);
  }
}
