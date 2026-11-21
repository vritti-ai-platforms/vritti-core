import type { SupplierInvoiceCounts } from '../../repositories/supplier-invoices.repository';

export class SupplierInvoiceCountsDto {
  lineCount: number;
  holdCount: number;

  // Shapes how many lines and holds a supplier invoice has, one per tab
  static from(row: SupplierInvoiceCounts): SupplierInvoiceCountsDto {
    const dto = new SupplierInvoiceCountsDto();
    dto.lineCount = row.lineCount;
    dto.holdCount = row.holdCount;
    return dto;
  }
}
