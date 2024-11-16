import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { AwsModule } from '@app/shared/aws/aws.module';

@Module({
  imports: [HttpModule, AwsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
