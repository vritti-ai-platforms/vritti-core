import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk';
import {
  type CreditNoteStatus,
  CreditNoteStatusValues,
  type CreditNoteType,
  type InvoicePartyType,
  InvoiceStatusValues,
} from '@/db/schema';
import type { ApplyCreditNoteDto } from '@/modules/credit-notes/dto/request/apply-credit-note.dto';
import type { CreateCreditNoteDto } from '@/modules/credit-notes/dto/request/create-credit-note.dto';
import { CreditNoteApplicationDto, CreditNoteDetailDto, CreditNoteDto } from '../dto/entity/credit-note.dto';
import { CreditNotesRepository } from '../repositories/credit-notes.repository';

// Invoice context pre-fetched by the app-layer before apply operations
export type InvoiceContext = {
  id: string;
  invoiceNumber: string;
  status: string;
  balance: number;
  paidAmount: number;
};

@Injectable()
export class CreditNotesService {
  private readonly logger = new Logger(CreditNotesService.name);

  constructor(private readonly repository: CreditNotesRepository) {}

  // Creates a new credit note
  async create(data: CreateCreditNoteDto): Promise<CreditNoteDto> {
    const entity = await this.repository.create({
      type: data.type as CreditNoteType,
      partyType: data.partyType as InvoicePartyType,
      partyId: data.partyId ?? null,
      partyName: data.partyName,
      creditNoteNumber: data.creditNoteNumber,
      amount: BigInt(data.amount),
      appliedAmount: 0n,
      remaining: BigInt(data.amount),
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

  // Applies a credit note against a pre-validated invoice context.
  // Returns invoice balance deltas for the app-layer to apply to the invoice.
  // App-layer is responsible for fetching the invoice, validating its status, and updating it.
  async apply(
    id: string,
    data: ApplyCreditNoteDto,
    invoice: InvoiceContext,
  ): Promise<{ newPaidAmount: number; newBalance: number; newInvoiceStatus: string; success: boolean; message: string }> {
    const creditNote = await this.repository.findById(id);
    if (!creditNote) throw new NotFoundException('Credit note not found.');

    if (creditNote.status === CreditNoteStatusValues.FULLY_APPLIED) {
      throw new BadRequestException('Credit note is already fully applied.');
    }

    const remaining = Number(creditNote.remaining);
    if (data.amount > remaining) {
      throw new BadRequestException('Application amount exceeds credit note remaining balance.');
    }

    if (invoice.status === InvoiceStatusValues.VOID || invoice.status === InvoiceStatusValues.PAID) {
      throw new BadRequestException('Cannot apply credit note to a voided or fully paid invoice.');
    }

    if (data.amount > invoice.balance) {
      throw new BadRequestException('Application amount exceeds invoice balance.');
    }

    await this.repository.createApplication({
      creditNoteId: id,
      invoiceId: data.invoiceId,
      amount: BigInt(data.amount),
    });

    const newAppliedAmount = creditNote.appliedAmount + BigInt(data.amount);
    const newRemaining = creditNote.amount - newAppliedAmount;
    const newCnStatus =
      newRemaining <= 0n ? CreditNoteStatusValues.FULLY_APPLIED : CreditNoteStatusValues.PARTIALLY_APPLIED;

    await this.repository.update(id, {
      appliedAmount: newAppliedAmount,
      remaining: newRemaining,
      status: newCnStatus,
    });

    const newBalance = invoice.balance - data.amount;
    const newPaidAmount = Number(invoice.paidAmount) + data.amount;
    const newInvoiceStatus = newBalance <= 0 ? InvoiceStatusValues.PAID : InvoiceStatusValues.PARTIALLY_PAID;

    this.logger.log(
      `Applied ${data.amount} from CN ${creditNote.creditNoteNumber} to invoice ${invoice.invoiceNumber}`,
    );
    return { newPaidAmount, newBalance, newInvoiceStatus, success: true, message: 'Credit note applied successfully.' };
  }
}
