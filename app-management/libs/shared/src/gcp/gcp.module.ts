import { Module } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { SynthesisService } from './synthesis.service';
import { TranslateService } from './translate.service';
import { GeminiService } from '@app/shared/gcp/gemini.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [
    FirestoreService,
    SynthesisService,
    TranslateService,
    GeminiService,
  ],
  imports: [HttpModule],
  exports: [
    FirestoreService,
    SynthesisService,
    TranslateService,
    GeminiService,
  ],
})
export class GcpModule {}
