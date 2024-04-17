import { Module } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { SynthesisService } from './synthesis.service';
import { TranslateService } from './translate.service';

@Module({
  providers: [FirestoreService, SynthesisService, TranslateService],
  exports: [FirestoreService, SynthesisService, TranslateService],
})
export class GcpModule {}
