import { Module } from '@nestjs/common';
import { CreditNotesRepository } from './repositories/credit-notes.repository';
import { CreditNotesService } from './services/credit-notes.service';

@Module({
  providers: [CreditNotesService, CreditNotesRepository],
  exports: [CreditNotesService],
})
export class CreditNotesDomainModule {}
