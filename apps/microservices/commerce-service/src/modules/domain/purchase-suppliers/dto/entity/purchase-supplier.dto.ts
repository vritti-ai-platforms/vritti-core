import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PurchaseLegStatus, PurchaseLegStep, PurchaseType } from '@/db/schema';
import type { PurchaseSupplierRow } from '../../repositories/purchase-suppliers.repository';

export const PurchaseLegActionValues = {
  EDIT_ALLOCATIONS: 'EDIT_ALLOCATIONS',
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  CREATE_PURCHASE_ORDER: 'CREATE_PURCHASE_ORDER',
  CONFIRM_PURCHASE_ORDER: 'CONFIRM_PURCHASE_ORDER',
  CREATE_INBOUND_DELIVERY: 'CREATE_INBOUND_DELIVERY',
  CREATE_GOODS_RECEIPT: 'CREATE_GOODS_RECEIPT',
  RECEIVE_WITH_INVOICE: 'RECEIVE_WITH_INVOICE',
  CREATE_SUPPLIER_INVOICE: 'CREATE_SUPPLIER_INVOICE',
  CLOSE_SUPPLIER: 'CLOSE_SUPPLIER',
  CANCEL_SUPPLIER: 'CANCEL_SUPPLIER',
} as const;

export type PurchaseLegAction = (typeof PurchaseLegActionValues)[keyof typeof PurchaseLegActionValues];

export const PurchaseLegStepLabels: Record<PurchaseLegStep, string> = {
  SOURCING: 'Sourcing',
  APPROVAL: 'Approval',
  PURCHASE_ORDER: 'Purchase Order',
  INBOUND_DELIVERY: 'Inbound Delivery',
  GOODS_RECEIPT: 'Goods Receipt',
  RECEIVE_WITH_INVOICE: 'Receive with Invoice',
  SUPPLIER_INVOICE: 'Supplier Invoice',
  APPROVE_INVOICE: 'Approve Invoice',
  CLOSED: 'Closed',
};

export const PurchaseTypeLabels: Record<PurchaseType, string> = {
  DIRECT_PURCHASE: 'Direct Purchase',
  DIRECT_RECEIPT: 'Receive, Invoice Later',
  ORDER_INVOICE_WITH_GOODS: 'Order, Invoice with Goods',
  STANDARD: 'Order, Receive, Invoice',
  ANNOUNCED: 'Order with Inbound Delivery',
  PREPAID: 'Order, Invoice, Receive',
  SELF_INVOICING: 'Order, Receive, Self-Invoice',
};

export class PurchaseSupplierDto {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierEnrollmentId: string;
  type: PurchaseType;
  approvalEnabled: boolean;
  approvalThreshold: CurrencyAmountDto;
  qualityCheckEnabled: boolean;
  step: PurchaseLegStep;
  status: PurchaseLegStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  closeReason: string | null;
  receivingClosedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;

  // Shapes a leg with its snapshot of the enrollment; the approval threshold is in the legal entity's currency, zero
  // when every leg needs approval
  static from(row: PurchaseSupplierRow, leCurrencyCode: string): PurchaseSupplierDto {
    const dto = new PurchaseSupplierDto();
    dto.id = row.id;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName;
    dto.supplierEnrollmentId = row.supplierEnrollmentId;
    dto.type = row.type;
    dto.approvalEnabled = row.approvalEnabled;
    dto.approvalThreshold = CurrencyAmountDto.from(row.approvalThreshold ?? 0n, leCurrencyCode);
    dto.qualityCheckEnabled = row.qualityCheckEnabled;
    dto.step = row.step;
    dto.status = row.status;
    dto.approvedBy = row.approvedBy;
    dto.approvedAt = row.approvedAt?.toISOString() ?? null;
    dto.closeReason = row.closeReason;
    dto.receivingClosedAt = row.receivingClosedAt?.toISOString() ?? null;
    dto.cancelledAt = row.cancelledAt?.toISOString() ?? null;
    dto.cancelReason = row.cancelReason;
    return dto;
  }
}
