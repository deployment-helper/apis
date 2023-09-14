import { Global, Module } from '@nestjs/common';
import { DynamodbClientService } from './dynamodb.service';
import { UserEntity } from './user.entity';
import { PresentationEntity } from './presentation.entity';
import { S3Service } from './s3.service';

@Global()
@Module({
  providers: [DynamodbClientService, UserEntity, PresentationEntity, S3Service],
  exports: [UserEntity, PresentationEntity, S3Service],
})
export class AwsModule {}
