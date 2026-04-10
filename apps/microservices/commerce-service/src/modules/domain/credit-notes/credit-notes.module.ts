import { Module } from '@nestjs/common';
import { InvoicesDomainModule } from '@domain/invoices/invoices.module';
import { CreditNotesRepository } from './repositories/credit-notes.repository';
import { CreditNotesService } from './services/credit-notes.service';

@Module({
  imports: [InvoicesDomainModule],
  providers: [CreditNotesService, CreditNotesRepository],
  exports: [CreditNotesService],
})
export class CreditNotesDomainModule {}
