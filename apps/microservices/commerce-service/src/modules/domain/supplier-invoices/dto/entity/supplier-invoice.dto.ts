import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import {
  type SupplierInvoicePaymentStatus,
  type SupplierInvoiceSource,
  type SupplierInvoiceStatus,
  SupplierInvoiceStatusValues,
} from '@/db/schema';
import type { SupplierInvoicePurchaseRef, SupplierInvoiceRow } from '../../repositories/supplier-invoices.repository';
import type { SupplierInvoiceHoldDto } from './supplier-invoice-hold.dto';
import type { SupplierInvoiceLineDto } from './supplier-invoice-line.dto';

export class SupplierInvoiceDto {
  id: string;
  legalEntityId: string;
  siteId: string;
  supplierId: string;
  supplierName: string;
  poNumbers: string[];
  purchases: SupplierInvoicePurchaseRef[];
  isReceiveWithInvoice: boolean;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string;
  source: SupplierInvoiceSource;
  currencyCode: string;
  exchangeRate: number;
  paymentTermId: string;
  paymentTermName: string | null;
  dueDate: string;
  status: SupplierInvoiceStatus;
  paymentStatus: SupplierInvoicePaymentStatus;
  subtotal: CurrencyAmountDto;
  discountAmount: CurrencyAmountDto;
  taxAmount: CurrencyAmountDto;
  totalAmount: CurrencyAmountDto;
  openHoldCount: number;
  lineCount: number;
  notes: string | null;
  postedAt: string | null;
  isPayable: boolean;
  canEdit: boolean;
  canPost: boolean;
  canCancel: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // Shapes an invoice header; it is payable once posted, with no open blocking hold and the supplier's payments not blocked
  static from(row: SupplierInvoiceRow): SupplierInvoiceDto {
    const dto = new SupplierInvoiceDto();
    const isDraft = row.status === SupplierInvoiceStatusValues.DRAFT;
    const isCancelled = row.status === SupplierInvoiceStatusValues.CANCELLED;
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName ?? '';
    dto.poNumbers = row.poNumbers;
    dto.purchases = row.purchases;
    dto.isReceiveWithInvoice = row.isReceiveWithInvoice;
    dto.invoiceNumber = row.invoiceNumber;
    dto.invoiceDate = row.invoiceDate;
    dto.taxDate = row.taxDate;
    dto.source = row.source;
    dto.currencyCode = row.currencyCode;
    dto.exchangeRate = row.exchangeRate;
    dto.paymentTermId = row.paymentTermId;
    dto.paymentTermName = row.paymentTermName;
    dto.dueDate = row.dueDate;
    dto.status = row.status;
    dto.paymentStatus = row.paymentStatus;
    dto.subtotal = CurrencyAmountDto.from(row.subtotal, row.currencyCode);
    dto.discountAmount = CurrencyAmountDto.from(row.discountAmount, row.currencyCode);
    dto.taxAmount = CurrencyAmountDto.from(row.taxAmount, row.currencyCode);
    dto.totalAmount = CurrencyAmountDto.from(row.totalAmount, row.currencyCode);
    dto.openHoldCount = row.openHoldCount;
    dto.lineCount = row.lineCount;
    dto.notes = row.notes;
    dto.postedAt = row.postedAt?.toISOString() ?? null;
    dto.isPayable =
      row.status === SupplierInvoiceStatusValues.POSTED && row.openHoldCount === 0 && !row.isSupplierPaymentBlocked;
    dto.canEdit = !isCancelled;
    dto.canPost = isDraft && row.lineCount > 0;
    dto.canCancel = !isCancelled;
    dto.canDelete = isDraft;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

export class SupplierInvoiceDetailDto extends SupplierInvoiceDto {
  lines: SupplierInvoiceLineDto[];
  holds: SupplierInvoiceHoldDto[];

  static fromDetail(
    row: SupplierInvoiceRow,
    lines: SupplierInvoiceLineDto[],
    holds: SupplierInvoiceHoldDto[],
  ): SupplierInvoiceDetailDto {
    const dto = Object.assign(new SupplierInvoiceDetailDto(), SupplierInvoiceDto.from(row));
    dto.lines = lines;
    dto.holds = holds;
    return dto;
  }
}
