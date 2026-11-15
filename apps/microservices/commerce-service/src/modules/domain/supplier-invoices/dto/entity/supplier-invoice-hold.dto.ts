import type { SupplierInvoiceHold, SupplierInvoiceHoldCode, SupplierInvoiceHoldStatus } from '@/db/schema';

export class SupplierInvoiceHoldDto {
  id: string;
  supplierInvoiceId: string;
  supplierInvoiceLineId: string | null;
  code: SupplierInvoiceHoldCode;
  detail: string;
  blocksPayment: boolean;
  status: SupplierInvoiceHoldStatus;
  releasedBy: string | null;
  releasedAt: string | null;
  releaseReason: string | null;
  createdAt: string;
  updatedAt: string;

  static from(row: SupplierInvoiceHold): SupplierInvoiceHoldDto {
    const dto = new SupplierInvoiceHoldDto();
    dto.id = row.id;
    dto.supplierInvoiceId = row.supplierInvoiceId;
    dto.supplierInvoiceLineId = row.supplierInvoiceLineId;
    dto.code = row.code;
    dto.detail = row.detail;
    dto.blocksPayment = row.blocksPayment;
    dto.status = row.status;
    dto.releasedBy = row.releasedBy;
    dto.releasedAt = row.releasedAt?.toISOString() ?? null;
    dto.releaseReason = row.releaseReason;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
