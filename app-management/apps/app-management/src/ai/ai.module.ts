import { Module } from '@nestjs/common';
import { SynthesisController } from './synthesis.controller';
import { GcpModule } from '@app/shared/gcp/gcp.module';

@Module({
  controllers: [SynthesisController],
  imports: [GcpModule],
})
export class AiModule {}
