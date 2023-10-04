import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BatchServerController } from './batch-server.controller';
import { BatchServerService } from './batch-server.service';
import { AppService } from '@apps/app-management/app.service';
import { VideoRecorderModule } from './video-recorder/video-recorder.module';
import { Mp3GeneratorModule } from './mp3-generator/mp3-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.getOrThrow('REDIS_HOST'),
          port: config.getOrThrow('REDIS_PORT'),
          password: config.getOrThrow('REDIS_PASS'),
        },
      }),
    }),
    VideoRecorderModule,
    Mp3GeneratorModule,
  ],
  controllers: [BatchServerController],
  providers: [AppService, BatchServerService],
})
export class BatchServerModule {}
