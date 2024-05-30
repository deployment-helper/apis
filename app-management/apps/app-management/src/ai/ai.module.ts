import { Module } from '@nestjs/common';
import { SynthesisController } from './synthesis.controller';
import { GcpModule } from '@app/shared/gcp/gcp.module';
import { TranslateController } from './translate.controller';
import { GeminiController } from './gemini.controller';

@Module({
  controllers: [SynthesisController, TranslateController, GeminiController],
  imports: [GcpModule],
})
export class AiModule {}
