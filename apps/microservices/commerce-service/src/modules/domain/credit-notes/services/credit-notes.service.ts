import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk';
import { type CreditNoteStatus, type CreditNoteType, type InvoicePartyType, CreditNoteStatusValues, InvoiceStatusValues } from '@/db/schema';
import { CreditNoteApplicationDto, CreditNoteDetailDto, CreditNoteDto } from '../dto/entity/credit-note.dto';
import type { CreateCreditNoteDto } from '@/modules/credit-notes/dto/request/create-credit-note.dto';
import type { ApplyCreditNoteDto } from '@/modules/credit-notes/dto/request/apply-credit-note.dto';
import { CreditNotesRepository } from '../repositories/credit-notes.repository';
import { InvoicesRepository } from '@domain/invoices/repositories/invoices.repository';

@Injectable()
export class CreditNotesService {
  private readonly logger = new Logger(CreditNotesService.name);

  constructor(
    private readonly repository: CreditNotesRepository,
    private readonly invoicesRepository: InvoicesRepository,
  ) {}

  // Creates a new credit note
  async create(data: CreateCreditNoteDto): Promise<CreditNoteDto> {
    const entity = await this.repository.create({
      type: data.type as CreditNoteType,
      partyType: data.partyType as InvoicePartyType,
      partyId: data.partyId ?? null,
      partyName: data.partyName,
      creditNoteNumber: data.creditNoteNumber,
      amount: String(data.amount),
      appliedAmount: '0',
      remaining: String(data.amount),
      reason: data.reason ?? null,
      status: (data.status as CreditNoteStatus) ?? CreditNoteStatusValues.DRAFT,
      issuedBy: data.issuedBy ?? null,
    });

    this.logger.log(`Created credit note: ${entity.creditNoteNumber} (${entity.id})`);
    return CreditNoteDto.from(entity);
  }

  // Returns credit note detail with applications
  async findById(id: string): Promise<CreditNoteDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Credit note not found.');
    const appRows = await this.repository.findApplicationsByCreditNoteId(id);
    const appDtos = appRows.map(CreditNoteApplicationDto.from);
    return CreditNoteDetailDto.fromDetail(entity, appDtos);
  }

  // Applies a credit note to an invoice
  async apply(id: string, data: ApplyCreditNoteDto): Promise<{ success: boolean; message: string }> {
    const creditNote = await this.repository.findById(id);
    if (!creditNote) throw new NotFoundException('Credit note not found.');

    if (creditNote.status === CreditNoteStatusValues.FULLY_APPLIED) {
      throw new BadRequestException('Credit note is already fully applied.');
    }

    const remaining = Number(creditNote.remaining);
    if (data.amount > remaining) {
      throw new BadRequestException('Application amount exceeds credit note remaining balance.');
    }

    const invoice = await this.invoicesRepository.findById(data.invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found.');

    if (invoice.status === InvoiceStatusValues.VOID || invoice.status === InvoiceStatusValues.PAID) {
      throw new BadRequestException('Cannot apply credit note to a voided or fully paid invoice.');
    }

    const invoiceBalance = Number(invoice.balance);
    if (data.amount > invoiceBalance) {
      throw new BadRequestException('Application amount exceeds invoice balance.');
    }

    await this.repository.createApplication({
      creditNoteId: id,
      invoiceId: data.invoiceId,
      amount: String(data.amount),
    });

    const newAppliedAmount = Number(creditNote.appliedAmount) + data.amount;
    const newRemaining = Number(creditNote.amount) - newAppliedAmount;
    const newCnStatus = newRemaining <= 0
      ? CreditNoteStatusValues.FULLY_APPLIED
      : CreditNoteStatusValues.PARTIALLY_APPLIED;

    await this.repository.update(id, {
      appliedAmount: String(newAppliedAmount),
      remaining: String(newRemaining),
      status: newCnStatus,
    });

    const newInvoiceBalance = invoiceBalance - data.amount;
    const newPaidAmount = Number(invoice.paidAmount) + data.amount;
    const newInvoiceStatus = newInvoiceBalance <= 0
      ? InvoiceStatusValues.PAID
      : InvoiceStatusValues.PARTIALLY_PAID;

    await this.invoicesRepository.update(invoice.id, {
      paidAmount: String(newPaidAmount),
      balance: String(newInvoiceBalance),
      status: newInvoiceStatus,
    });

    this.logger.log(`Applied ${data.amount} from CN ${creditNote.creditNoteNumber} to invoice ${invoice.invoiceNumber}`);
    return { success: true, message: 'Credit note applied successfully.' };
  }
}
