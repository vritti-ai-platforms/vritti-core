import type { AddSupplierInvoiceLineDto } from '@domain/supplier-invoices/dto/request/add-supplier-invoice-line.dto';
import type { UpdateSupplierInvoiceLineDto } from '@domain/supplier-invoices/dto/request/update-supplier-invoice-line.dto';
import { SupplierInvoiceLinesDomainService } from '@domain/supplier-invoices/services/supplier-invoice-lines.service';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SupplierInvoicesService } from '../../root/services/supplier-invoices.service';

@Injectable()
export class SupplierInvoiceLinesService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly invoicesService: SupplierInvoicesService,
    private readonly invoicesDomainService: SupplierInvoicesDomainService,
    private readonly linesService: SupplierInvoiceLinesDomainService,
  ) {}

  // Adds a validated line; on a posted invoice the PO line invoiced counters and stock costing move with it, in one
  // transaction
  async create(dto: AddSupplierInvoiceLineDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const { supplierInvoiceId, ...fields } = dto;
    const invoice = await this.invoicesDomainService.findEditableOrThrow(supplierInvoiceId);
    this.invoicesService.assertNotReceiveWithInvoiceDraft(invoice);
    const line = await this.linesService.prepare(invoice, fields);
    return this.database.runInTransaction(() =>
      this.invoicesService.changeLines(invoice, leCurrencyCode, () => this.linesService.create(invoice, line)),
    );
  }

  // Replaces a line with a validated one; on a posted invoice the PO line invoiced counters and stock costing move with
  // it, in one transaction
  async update(dto: UpdateSupplierInvoiceLineDto, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const { id, supplierInvoiceId, ...fields } = dto;
    const invoice = await this.invoicesDomainService.findEditableOrThrow(supplierInvoiceId);
    this.invoicesService.assertNotReceiveWithInvoiceDraft(invoice);
    await this.linesService.findOnInvoiceOrThrow(invoice.id, id);
    const line = await this.linesService.prepare(invoice, fields, { excludeLineId: id });
    return this.database.runInTransaction(() =>
      this.invoicesService.changeLines(invoice, leCurrencyCode, () => this.linesService.update(invoice, id, line)),
    );
  }

  // Removes a line; on a posted invoice the PO line invoiced counters and stock costing move with it, in one transaction
  async delete(supplierInvoiceId: string, id: string, leCurrencyCode: string): Promise<SuccessResponseDto> {
    const invoice = await this.invoicesDomainService.findEditableOrThrow(supplierInvoiceId);
    await this.linesService.findOnInvoiceOrThrow(invoice.id, id);
    return this.database.runInTransaction(() =>
      this.invoicesService.changeLines(invoice, leCurrencyCode, () => this.linesService.delete(invoice, id)),
    );
  }
}
