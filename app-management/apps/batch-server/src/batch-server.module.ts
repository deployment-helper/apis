import { Module } from '@nestjs/common';
import { BatchServerController } from './batch-server.controller';
import { BatchServerService } from './batch-server.service';
import { AppService } from '@apps/app-management/app.service';

@Module({
  imports: [],
  controllers: [BatchServerController],
  providers: [AppService, BatchServerService],
})
export class BatchServerModule {}
