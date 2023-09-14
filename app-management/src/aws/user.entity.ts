import { Injectable } from '@nestjs/common';
import { DynamodbClientService } from './dynamodb.service';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { UserModel } from 'src/models/user.model';

@Injectable()
export class UserEntity {
  private tableName = 'users';

  constructor(private db: DynamodbClientService) {}

  add(email: string, userId: string) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        email: email,
        userId: userId,
        updated_at: new Date().toISOString(),
      },
    });
    return this.db.send(command);
  }

  get(email: string) {
    const command = UserModel.toDynamoDbGetItemCommand(email);
    return this.db.send(command);
  }
}
