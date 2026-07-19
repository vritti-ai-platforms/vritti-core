import { CreditNotesDomainModule } from '@domain/credit-notes/credit-notes.module';
import { InvoicesDomainModule } from '@domain/invoices/invoices.module';
import { Module } from '@nestjs/common';
import { CreditNotesController } from './credit-notes.controller';
import { CreditNotesService } from './services/credit-notes.service';

@Module({
  imports: [CreditNotesDomainModule, InvoicesDomainModule],
  controllers: [CreditNotesController],
  providers: [CreditNotesService],
})
export class SiteCreditNotesModule {}
