import { CreditNotesDomainModule } from '@domain/credit-notes/credit-notes.module';
import { Module } from '@nestjs/common';
import { CreditNotesController } from './credit-notes.controller';

@Module({
  imports: [CreditNotesDomainModule],
  controllers: [CreditNotesController],
})
export class CreditNotesModule {}
