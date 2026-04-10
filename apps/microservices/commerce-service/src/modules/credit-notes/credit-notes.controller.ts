import type { CreditNoteDetailDto, CreditNoteDto } from '@domain/credit-notes/dto/entity/credit-note.dto';
import { CreditNotesService } from '@domain/credit-notes/services/credit-notes.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { ApplyCreditNoteDto } from './dto/request/apply-credit-note.dto';
import type { CreateCreditNoteDto } from './dto/request/create-credit-note.dto';

@Controller()
export class CreditNotesController {
  private readonly logger = new Logger(CreditNotesController.name);

  constructor(private readonly service: CreditNotesService) {}

  @MessagePattern({ cmd: 'creditNotes.create' })
  async create(@Payload() dto: CreateCreditNoteDto): Promise<CreditNoteDto> {
    this.logger.log(`creditNotes.create — number: ${dto.creditNoteNumber}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'creditNotes.findById' })
  async findById(@Payload() data: { id: string }): Promise<CreditNoteDetailDto> {
    this.logger.log(`creditNotes.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'creditNotes.apply' })
  async apply(@Payload() data: { id: string } & ApplyCreditNoteDto): Promise<{ success: boolean; message: string }> {
    const { id, ...applyData } = data;
    this.logger.log(`creditNotes.apply — id: ${id}, invoiceId: ${applyData.invoiceId}`);
    return this.service.apply(id, applyData);
  }
}
