import type { CreditNoteDetailDto, CreditNoteDto } from '@domain/credit-notes/dto/entity/credit-note.dto';
import { ApplyCreditNoteDto } from '@domain/credit-notes/dto/request/apply-credit-note.dto';
import { CreateCreditNoteDto } from '@domain/credit-notes/dto/request/create-credit-note.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreditNotesService } from './services/credit-notes.service';

@Controller()
export class CreditNotesController {
  private readonly logger = new Logger(CreditNotesController.name);

  constructor(private readonly service: CreditNotesService) {}

  @MessagePattern({ cmd: 'site.creditNotes.create' })
  async create(@Payload() dto: CreateCreditNoteDto): Promise<CreditNoteDto> {
    this.logger.log(`creditNotes.create — number: ${dto.creditNoteNumber}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'site.creditNotes.findById' })
  async findById(@Payload() data: { id: string }): Promise<CreditNoteDetailDto> {
    this.logger.log(`creditNotes.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'site.creditNotes.apply' })
  async apply(@Payload() dto: ApplyCreditNoteDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`creditNotes.apply — id: ${dto.id}, invoiceId: ${dto.invoiceId}`);
    return this.service.apply(dto);
  }
}
