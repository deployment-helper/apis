import { Global, Module } from '@nestjs/common';
import { DynamodbClientService } from './dynamodb.service';
import { UserEntity } from './user.entity';
import { PresentationEntity } from './presentation.entity';
import { S3Service } from './s3.service';
import { SnsService } from './sns.service';
import {AwsController} from "@apps/app-management/aws/aws.controller";

@Global()
@Module({
  providers: [
    DynamodbClientService,
    UserEntity,
    PresentationEntity,
    S3Service,
    SnsService,
  ],
  controllers: [AwsController],
  exports: [UserEntity, PresentationEntity, S3Service, SnsService],
})
export class AwsModule {}
