import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { type SupplierInvoiceLineFlag, type SupplierInvoiceStatus, SupplierInvoiceStatusValues } from '@/db/schema';
import type { SupplierInvoiceRow } from '../../repositories/supplier-invoices.repository';
import type { SupplierInvoiceLineDto } from './supplier-invoice-line.dto';

export class SupplierInvoiceDto {
  id: string;
  legalEntityId: string;
  siteId: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  poNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string;
  currencyCode: string;
  exchangeRate: number;
  poExchangeRate: number;
  status: SupplierInvoiceStatus;
  subtotal: CurrencyAmountDto;
  discountAmount: CurrencyAmountDto;
  taxAmount: CurrencyAmountDto;
  totalAmount: CurrencyAmountDto;
  flags: SupplierInvoiceLineFlag[];
  flagCount: number;
  lineCount: number;
  notes: string | null;
  postedAt: string | null;
  canEdit: boolean;
  canPost: boolean;
  canCancel: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: SupplierInvoiceRow): SupplierInvoiceDto {
    const dto = new SupplierInvoiceDto();
    const isDraft = row.status === SupplierInvoiceStatusValues.DRAFT;
    const isCancelled = row.status === SupplierInvoiceStatusValues.CANCELLED;
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName ?? '';
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.poNumber = row.poNumber;
    dto.invoiceNumber = row.invoiceNumber;
    dto.invoiceDate = row.invoiceDate;
    dto.taxDate = row.taxDate;
    dto.currencyCode = row.currencyCode;
    dto.exchangeRate = row.exchangeRate;
    dto.poExchangeRate = row.poExchangeRate;
    dto.status = row.status;
    dto.subtotal = CurrencyAmountDto.from(row.subtotal, row.currencyCode);
    dto.discountAmount = CurrencyAmountDto.from(row.discountAmount, row.currencyCode);
    dto.taxAmount = CurrencyAmountDto.from(row.taxAmount, row.currencyCode);
    dto.totalAmount = CurrencyAmountDto.from(row.totalAmount, row.currencyCode);
    dto.flags = row.flags;
    dto.flagCount = row.flagCount;
    dto.lineCount = row.lineCount;
    dto.notes = row.notes;
    dto.postedAt = row.postedAt?.toISOString() ?? null;
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

  static fromDetail(row: SupplierInvoiceRow, lines: SupplierInvoiceLineDto[]): SupplierInvoiceDetailDto {
    const dto = Object.assign(new SupplierInvoiceDetailDto(), SupplierInvoiceDto.from(row));
    dto.lines = lines;
    return dto;
  }
}
