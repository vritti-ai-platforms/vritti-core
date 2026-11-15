import Decimal from '@vritti/api-sdk/decimal';
import type { PurchaseOrderInvoiceSummaryRow } from '../../repositories/supplier-invoices.repository';

export class PurchaseOrderInvoiceSummaryDto {
  invoiceCount: number;
  heldInvoiceCount: number;
  invoicedPrimaryQty: number;
  duePrimaryQty: number;
  invoicedPercent: number;

  static from(row: PurchaseOrderInvoiceSummaryRow): PurchaseOrderInvoiceSummaryDto {
    const dto = new PurchaseOrderInvoiceSummaryDto();
    const invoiced = new Decimal(row.invoicedPrimaryQty);
    const due = new Decimal(row.duePrimaryQty);
    dto.invoiceCount = row.invoiceCount;
    dto.heldInvoiceCount = row.heldInvoiceCount;
    dto.invoicedPrimaryQty = invoiced.toNumber();
    dto.duePrimaryQty = due.toNumber();
    dto.invoicedPercent = due.isZero() ? 0 : invoiced.div(due).times(100).toDecimalPlaces(1).toNumber();
    return dto;
  }
}
