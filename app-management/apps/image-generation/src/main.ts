import { NestFactory } from '@nestjs/core';
import { ImageGenerationModule } from './image-generation.module';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create(ImageGenerationModule, { cors: true });
  await app.listen(process.env.PORT || 9090);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
