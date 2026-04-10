import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  BadRequestException,
  type SearchState,
  type SortCondition,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type InvoicePartyType, type InvoiceStatus, type InvoiceType, invoices, InvoiceStatusValues } from '@/db/schema';
import { InvoiceDetailDto, InvoiceDto, InvoiceItemDto } from '../dto/entity/invoice.dto';
import type { CreateInvoiceDto, CreateInvoiceItemDto } from '@/modules/invoices/dto/request/create-invoice.dto';
import type { UpdateInvoiceDto } from '@/modules/invoices/dto/request/update-invoice.dto';
import { InvoicesRepository } from '../repositories/invoices.repository';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  private static readonly FIELD_MAP: FieldMap = {
    invoiceNumber: { column: invoices.invoiceNumber, type: 'string' },
    type: { column: invoices.type, type: 'string' },
    partyType: { column: invoices.partyType, type: 'string' },
    partyName: { column: invoices.partyName, type: 'string' },
    status: { column: invoices.status, type: 'string' },
    totalAmount: { column: invoices.totalAmount, type: 'number' },
    balance: { column: invoices.balance, type: 'number' },
  };

  constructor(private readonly repository: InvoicesRepository) {}

  // Returns paginated invoices for the data table
  async findForTable(params: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: InvoiceDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, InvoicesService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, InvoicesService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(params.sort, InvoicesService.FIELD_MAP);

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(invoices.createdAt)],
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    return { result: rows.map(InvoiceDto.from), count };
  }

  // Creates a new invoice with line items
  async create(data: CreateInvoiceDto): Promise<InvoiceDto> {
    const subtotal = this.calculateSubtotal(data.items);
    const taxAmount = this.calculateTaxAmount(data.items);
    const discountAmount = data.discountAmount ?? 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const entity = await this.repository.create({
      type: data.type as InvoiceType,
      invoiceNumber: data.invoiceNumber,
      partyType: data.partyType as InvoicePartyType,
      partyId: data.partyId ?? null,
      partyName: data.partyName,
      referenceType: data.referenceType ?? null,
      referenceId: data.referenceId ?? null,
      subtotal: String(subtotal),
      taxAmount: String(taxAmount),
      discountAmount: String(discountAmount),
      totalAmount: String(totalAmount),
      paidAmount: '0',
      balance: String(totalAmount),
      status: (data.status as InvoiceStatus) ?? InvoiceStatusValues.DRAFT,
      paymentTerms: data.paymentTerms ?? null,
      issuedDate: data.issuedDate ?? null,
      dueDate: data.dueDate ?? null,
      notes: data.notes ?? null,
    });

    if (data.items?.length) {
      await this.repository.createItems(
        data.items.map((item) => ({
          invoiceId: entity.id,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          taxAmount: String(item.taxAmount ?? 0),
          total: String(item.quantity * item.unitPrice + (item.taxAmount ?? 0)),
          referenceItemId: item.referenceItemId ?? null,
        })),
      );
    }

    this.logger.log(`Created invoice: ${entity.invoiceNumber} (${entity.id})`);
    return InvoiceDto.from(entity);
  }

  // Returns invoice detail with line items
  async findById(id: string): Promise<InvoiceDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Invoice not found.');
    const itemRows = await this.repository.findItemsByInvoiceId(id);
    const itemDtos = itemRows.map(InvoiceItemDto.from);
    return InvoiceDetailDto.fromDetail(entity, itemDtos);
  }

  // Updates an invoice
  async update(id: string, data: UpdateInvoiceDto): Promise<InvoiceDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Invoice not found.');

    if (existing.status !== InvoiceStatusValues.DRAFT) {
      throw new BadRequestException('Only draft invoices can be updated.');
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.partyType !== undefined) updatePayload.partyType = data.partyType;
    if (data.partyId !== undefined) updatePayload.partyId = data.partyId;
    if (data.partyName !== undefined) updatePayload.partyName = data.partyName;
    if (data.referenceType !== undefined) updatePayload.referenceType = data.referenceType;
    if (data.referenceId !== undefined) updatePayload.referenceId = data.referenceId;
    if (data.paymentTerms !== undefined) updatePayload.paymentTerms = data.paymentTerms;
    if (data.issuedDate !== undefined) updatePayload.issuedDate = data.issuedDate;
    if (data.dueDate !== undefined) updatePayload.dueDate = data.dueDate;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.status !== undefined) updatePayload.status = data.status;

    if (data.items !== undefined) {
      await this.repository.deleteItemsByInvoiceId(id);
      if (data.items.length > 0) {
        await this.repository.createItems(
          data.items.map((item) => ({
            invoiceId: id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            taxAmount: String(item.taxAmount ?? 0),
            total: String(item.quantity * item.unitPrice + (item.taxAmount ?? 0)),
            referenceItemId: item.referenceItemId ?? null,
          })),
        );
      }

      const subtotal = this.calculateSubtotal(data.items);
      const taxAmount = this.calculateTaxAmount(data.items);
      const discountAmount = data.discountAmount ?? Number(existing.discountAmount);
      const totalAmount = subtotal + taxAmount - discountAmount;

      updatePayload.subtotal = String(subtotal);
      updatePayload.taxAmount = String(taxAmount);
      updatePayload.discountAmount = String(discountAmount);
      updatePayload.totalAmount = String(totalAmount);
      updatePayload.balance = String(totalAmount - Number(existing.paidAmount));
    } else if (data.discountAmount !== undefined) {
      const subtotal = Number(existing.subtotal);
      const taxAmount = Number(existing.taxAmount);
      const totalAmount = subtotal + taxAmount - data.discountAmount;
      updatePayload.discountAmount = String(data.discountAmount);
      updatePayload.totalAmount = String(totalAmount);
      updatePayload.balance = String(totalAmount - Number(existing.paidAmount));
    }

    const entity = Object.keys(updatePayload).length > 0
      ? await this.repository.update(id, updatePayload)
      : existing;

    this.logger.log(`Updated invoice: ${entity.invoiceNumber} (${entity.id})`);
    return InvoiceDto.from(entity);
  }

  // Updates the status of an invoice
  async updateStatus(id: string, status: string): Promise<InvoiceDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Invoice not found.');

    const entity = await this.repository.update(id, { status: status as InvoiceStatus });
    this.logger.log(`Updated invoice status: ${entity.invoiceNumber} -> ${status}`);
    return InvoiceDto.from(entity);
  }

  // Calculates subtotal from invoice items
  private calculateSubtotal(items: CreateInvoiceItemDto[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  // Calculates total tax from invoice items
  private calculateTaxAmount(items: CreateInvoiceItemDto[]): number {
    return items.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0);
  }
}
