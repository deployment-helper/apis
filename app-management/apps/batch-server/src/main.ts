import { NestFactory } from '@nestjs/core';
import { BatchServerModule } from './batch-server.module';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(BatchServerModule, { cors: true });
  await app.listen(process.env.PORT || 8080);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
