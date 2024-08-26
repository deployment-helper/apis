import { Global, Module } from '@nestjs/common';
import { DynamodbClientService } from './dynamodb.service';
import { UserEntity } from './user.entity';
import { PresentationEntity } from './presentation.entity';
import { S3Service } from './s3.service';
import { SnsService } from './sns.service';
import { AwsController } from '@apps/app-management/aws/aws.controller';
import { FsService } from '@app/shared/fs/fs.service';

@Global()
@Module({
  providers: [
    DynamodbClientService,
    UserEntity,
    PresentationEntity,
    S3Service,
    SnsService,
    FsService,
  ],
  controllers: [AwsController],
  exports: [UserEntity, PresentationEntity, S3Service, SnsService],
})
export class AwsModule {}
