import { Module } from '@nestjs/common';
import { CreditNotesDomainRepository } from './repositories/credit-notes.repository';
import { CreditNotesDomainService } from './services/credit-notes.service';

@Module({
  providers: [CreditNotesDomainService, CreditNotesDomainRepository],
  exports: [CreditNotesDomainService],
})
export class CreditNotesDomainModule {}
