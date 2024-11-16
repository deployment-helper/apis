import { Module } from '@nestjs/common';
import { SlidesController } from './slides.controller';
import { AwsModule } from '@app/shared/aws/aws.module';

@Module({
  controllers: [SlidesController],
  imports: [AwsModule],
})
export class SlidesModule {}
