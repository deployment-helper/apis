import { Module } from '@nestjs/common';
import { SynthesisController } from './synthesis.controller';
import { GcpModule } from '@app/shared/gcp/gcp.module';
import { TranslateController } from './translate.controller';

@Module({
  controllers: [SynthesisController, TranslateController],
  imports: [GcpModule],
})
export class AiModule {}
