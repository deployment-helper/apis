import { Module } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { SynthesisService } from './synthesis.service';

@Module({
  providers: [FirestoreService, SynthesisService],
  exports: [FirestoreService, SynthesisService],
})
export class GcpModule {}
