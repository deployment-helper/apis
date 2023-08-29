import { Global, Module } from '@nestjs/common';
import { DynamodbClientService } from './client.service';
import { UserEntity } from './user.entity';

@Global()
@Module({
  providers: [DynamodbClientService, UserEntity],
  exports: [UserEntity],
})
export class DynamodbModule {}
