import { Global, Module } from '@nestjs/common';
import { DynamodbClientService } from './dynamodb.service';
import { UserEntity } from './user.entity';
import { PresentationEntity } from './presentation.entity';
import { SnsService } from './sns.service';
import { AwsController } from '@apps/app-management/aws/aws.controller';
import { FsService } from '@app/shared/fs/fs.service';
import { AwsModule as SharedAwsModule } from '@app/shared/aws/aws.module';

@Global()
@Module({
  providers: [
    DynamodbClientService,
    UserEntity,
    PresentationEntity,
    SnsService,
    FsService,
  ],
  imports: [SharedAwsModule],
  controllers: [AwsController],
  exports: [UserEntity, PresentationEntity, SnsService],
})
export class AwsModule {}
