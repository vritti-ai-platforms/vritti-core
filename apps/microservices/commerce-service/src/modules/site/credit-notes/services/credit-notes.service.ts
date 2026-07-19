import type { CreditNoteDetailDto, CreditNoteDto } from '@domain/credit-notes/dto/entity/credit-note.dto';
import type { ApplyCreditNoteDto } from '@domain/credit-notes/dto/request/apply-credit-note.dto';
import type { CreateCreditNoteDto } from '@domain/credit-notes/dto/request/create-credit-note.dto';
import { CreditNotesDomainService } from '@domain/credit-notes/services/credit-notes.service';
import { InvoicesDomainRepository } from '@domain/invoices/repositories/invoices.repository';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { InvoiceStatusValues } from '@/db/schema';

@Injectable()
export class CreditNotesService {
  constructor(
    private readonly service: CreditNotesDomainService,
    private readonly invoicesRepository: InvoicesDomainRepository,
  ) {}

  create(dto: CreateCreditNoteDto): Promise<CreditNoteDto> {
    return this.service.create(dto);
  }

  findById(id: string): Promise<CreditNoteDetailDto> {
    return this.service.findById(id);
  }

  async apply(dto: ApplyCreditNoteDto): Promise<{ success: boolean; message: string }> {
    const { id, ...applyData } = dto;
    const invoice = await this.invoicesRepository.findById(applyData.invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    const invoiceContext = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      balance: invoice.balance,
      paidAmount: invoice.paidAmount,
    };
    const result = await this.service.apply(id, applyData, invoiceContext);
    await this.invoicesRepository.update(invoice.id, {
      paidAmount: result.newPaidAmount,
      balance: result.newBalance,
      status: result.newInvoiceStatus as (typeof InvoiceStatusValues)[keyof typeof InvoiceStatusValues],
    });
    return { success: result.success, message: result.message };
  }
}
