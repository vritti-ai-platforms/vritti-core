import type { CreditNoteDetailDto, CreditNoteDto } from '@domain/credit-notes/dto/entity/credit-note.dto';
import { CreditNotesService } from '@domain/credit-notes/services/credit-notes.service';
import { InvoicesRepository } from '@domain/invoices/repositories/invoices.repository';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotFoundException } from '@vritti/api-sdk';
import { InvoiceStatusValues } from '@/db/schema';
import type { ApplyCreditNoteDto } from './dto/request/apply-credit-note.dto';
import type { CreateCreditNoteDto } from './dto/request/create-credit-note.dto';

@Controller()
export class CreditNotesController {
  private readonly logger = new Logger(CreditNotesController.name);

  constructor(
    private readonly service: CreditNotesService,
    private readonly invoicesRepository: InvoicesRepository,
  ) {}

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
    const invoice = await this.invoicesRepository.findById(applyData.invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    const invoiceContext = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      balance: Number(invoice.balance),
      paidAmount: Number(invoice.paidAmount),
    };
    const result = await this.service.apply(id, applyData, invoiceContext);
    await this.invoicesRepository.update(invoice.id, {
      paidAmount: BigInt(result.newPaidAmount),
      balance: BigInt(result.newBalance),
      status: result.newInvoiceStatus as (typeof InvoiceStatusValues)[keyof typeof InvoiceStatusValues],
    });
    return { success: result.success, message: result.message };
  }
}
