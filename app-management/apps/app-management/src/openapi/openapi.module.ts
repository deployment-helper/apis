import { Module } from '@nestjs/common';
import { ChatgptController } from './chatgpt.controller';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';

@Module({
  controllers: [ChatgptController],
  providers: [ChatgptService],
})
export class OpenapiModule {}
