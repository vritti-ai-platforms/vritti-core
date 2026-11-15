import type { SupplierInvoiceHoldCode, SupplierInvoiceStatus } from '@/db/schema';
import type { PurchaseOrderInvoiceHoldRow } from '../../repositories/supplier-invoice-holds.repository';

export class PurchaseOrderInvoiceHoldDto {
  id: string;
  code: SupplierInvoiceHoldCode;
  detail: string;
  blocksPayment: boolean;
  supplierInvoiceId: string;
  supplierInvoiceLineId: string | null;
  invoiceNumber: string;
  invoiceStatus: SupplierInvoiceStatus;
  purchaseOrderItemId: string | null;
  lotNumber: string | null;

  static from(row: PurchaseOrderInvoiceHoldRow): PurchaseOrderInvoiceHoldDto {
    const dto = new PurchaseOrderInvoiceHoldDto();
    dto.id = row.id;
    dto.code = row.code;
    dto.detail = row.detail;
    dto.blocksPayment = row.blocksPayment;
    dto.supplierInvoiceId = row.supplierInvoiceId;
    dto.supplierInvoiceLineId = row.supplierInvoiceLineId;
    dto.invoiceNumber = row.invoiceNumber;
    dto.invoiceStatus = row.invoiceStatus;
    dto.purchaseOrderItemId = row.purchaseOrderItemId;
    dto.lotNumber = row.lotNumber;
    return dto;
  }
}
