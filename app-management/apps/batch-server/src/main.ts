import { NestFactory } from '@nestjs/core';
import { BatchServerModule } from './batch-server.module';

async function bootstrap() {
  const app = await NestFactory.create(BatchServerModule);
  await app.listen(8080);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
