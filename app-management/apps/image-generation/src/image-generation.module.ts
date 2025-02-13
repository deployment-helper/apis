import { Module } from '@nestjs/common';
import { ImageGenerationController } from './image-generation.controller';
import { ImageGenerationService } from './image-generation.service';
import { ChatgptService } from '@app/shared/openapi/chatgpt.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ImageGenerationController],
  providers: [ImageGenerationService, ChatgptService],
})
export class ImageGenerationModule {}
