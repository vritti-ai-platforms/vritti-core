import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import {
  type InvoicePartyType,
  type InvoiceStatus,
  InvoiceStatusValues,
  type InvoiceType,
  invoices,
} from '@/db/schema';
import type { CreateInvoiceDto, CreateInvoiceItemDto } from '@/modules/invoices/dto/request/create-invoice.dto';
import type { UpdateInvoiceDto } from '@/modules/invoices/dto/request/update-invoice.dto';
import { InvoiceDetailDto, InvoiceDto, InvoiceItemDto } from '../dto/entity/invoice.dto';
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
  async findForTable(state: TableViewState): Promise<{ result: InvoiceDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InvoicesService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InvoicesService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InvoicesService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(invoices.createdAt)],
      limit,
      offset,
    });

    return { result: rows.map(InvoiceDto.from), count };
  }

  // Creates a new invoice with line items
  async create(data: CreateInvoiceDto): Promise<InvoiceDto> {
    const subtotal = this.calculateSubtotal(data.items);
    const taxAmount = this.calculateTaxAmount(data.items);
    const discountAmount = BigInt(data.discountAmount ?? 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const entity = await this.repository.create({
      type: data.type as InvoiceType,
      invoiceNumber: data.invoiceNumber,
      partyType: data.partyType as InvoicePartyType,
      partyId: data.partyId ?? null,
      partyName: data.partyName,
      referenceType: data.referenceType ?? null,
      referenceId: data.referenceId ?? null,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount: 0n,
      balance: totalAmount,
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
          quantity: item.quantity,
          unitPrice: BigInt(item.unitPrice),
          taxAmount: BigInt(item.taxAmount ?? 0),
          total: BigInt(item.quantity * item.unitPrice + (item.taxAmount ?? 0)),
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

    const { items: _items, discountAmount: _discountAmount, ...scalarFields } = data;
    const updatePayload: Record<string, unknown> = { ...scalarFields };

    if (data.items !== undefined) {
      await this.repository.deleteItemsByInvoiceId(id);
      if (data.items.length > 0) {
        await this.repository.createItems(
          data.items.map((item) => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: BigInt(item.unitPrice),
            taxAmount: BigInt(item.taxAmount ?? 0),
            total: BigInt(item.quantity * item.unitPrice + (item.taxAmount ?? 0)),
            referenceItemId: item.referenceItemId ?? null,
          })),
        );
      }

      const subtotal = this.calculateSubtotal(data.items);
      const taxAmount = this.calculateTaxAmount(data.items);
      const discountAmount = BigInt(data.discountAmount ?? 0) ?? existing.discountAmount;
      const totalAmount = subtotal + taxAmount - discountAmount;

      updatePayload.subtotal = subtotal;
      updatePayload.taxAmount = taxAmount;
      updatePayload.discountAmount = discountAmount;
      updatePayload.totalAmount = totalAmount;
      updatePayload.balance = totalAmount - existing.paidAmount;
    } else if (data.discountAmount !== undefined) {
      const subtotal = existing.subtotal;
      const taxAmount = existing.taxAmount;
      const discountAmount = BigInt(data.discountAmount);
      const totalAmount = subtotal + taxAmount - discountAmount;
      updatePayload.discountAmount = discountAmount;
      updatePayload.totalAmount = totalAmount;
      updatePayload.balance = totalAmount - existing.paidAmount;
    }

    const entity = await this.repository.update(id, updatePayload);

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
  private calculateSubtotal(items: CreateInvoiceItemDto[]): bigint {
    return items.reduce((sum, item) => sum + BigInt(item.quantity * item.unitPrice), 0n);
  }

  // Calculates total tax from invoice items
  private calculateTaxAmount(items: CreateInvoiceItemDto[]): bigint {
    return items.reduce((sum, item) => sum + BigInt(item.taxAmount ?? 0), 0n);
  }
}
