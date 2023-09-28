import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { BatchServerController } from './batch-server.controller';
import { BatchServerService } from './batch-server.service';
import { AppService } from '@apps/app-management/app.service';
import { VideoRecorderModule } from './video-recorder/video-recorder.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    VideoRecorderModule,
  ],
  controllers: [BatchServerController],
  providers: [AppService, BatchServerService],
})
export class BatchServerModule {}
