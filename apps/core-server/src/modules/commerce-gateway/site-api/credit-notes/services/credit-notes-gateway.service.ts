import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { ApplyCreditNoteDto } from '@commerce/credit-notes/dto/request/apply-credit-note.dto';
import type { CreateCreditNoteDto } from '@commerce/credit-notes/dto/request/create-credit-note.dto';
import type { CreditNoteDetailResponseDto, CreditNoteResponseDto } from '@commerce/credit-notes/dto/response/credit-note-response.dto';

@Injectable()
export class CreditNotesGatewayService {
  private readonly logger = new Logger(CreditNotesGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Creates a new credit note
  async create(dto: CreateCreditNoteDto): Promise<CreditNoteResponseDto> {
    this.logger.log(`creditNotes.create — number: ${dto.creditNoteNumber}`);
    return this.nats.send('commerce', 'site.creditNotes.create', dto);
  }

  // Finds a credit note by ID with applications
  async findById(id: string): Promise<CreditNoteDetailResponseDto> {
    this.logger.log(`creditNotes.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.creditNotes.findById', { id });
  }

  // Applies a credit note to an invoice
  async apply(id: string, dto: ApplyCreditNoteDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`creditNotes.apply — id: ${id}, invoiceId: ${dto.invoiceId}`);
    return this.nats.send('commerce', 'site.creditNotes.apply', { id, ...dto });
  }
}
