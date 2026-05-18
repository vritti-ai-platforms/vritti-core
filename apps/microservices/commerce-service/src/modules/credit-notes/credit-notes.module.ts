import { CreditNotesDomainModule } from '@domain/credit-notes/credit-notes.module';
import { InvoicesDomainModule } from '@domain/invoices/invoices.module';
import { Module } from '@nestjs/common';
import { CreditNotesController } from './credit-notes.controller';

@Module({
  imports: [CreditNotesDomainModule, InvoicesDomainModule],
  controllers: [CreditNotesController],
})
export class CreditNotesModule {}
