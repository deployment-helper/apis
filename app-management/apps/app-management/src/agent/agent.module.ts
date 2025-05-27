import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { SharedModule } from '@app/shared';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
    SharedModule,
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
