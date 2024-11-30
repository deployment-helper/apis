import { Module } from '@nestjs/common';
import { S3Service } from '@app/shared/aws/s3.service';
import { FsService } from '@app/shared/fs/fs.service';

@Module({
  providers: [S3Service, FsService],
  controllers: [],
  exports: [S3Service],
})
export class AwsModule {}
