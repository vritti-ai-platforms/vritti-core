import type { PurchaseEventRow } from '../../repositories/purchase-events.repository';

export const PurchaseEventActionValues = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  CANCEL: 'CANCEL',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  SUBMIT_ITEMS: 'SUBMIT_ITEMS',
  REQUEST_QUOTATION: 'REQUEST_QUOTATION',
  COMPLETE_QUOTATIONS: 'COMPLETE_QUOTATIONS',
  ADD_ALLOCATION: 'ADD_ALLOCATION',
  UPDATE_ALLOCATION: 'UPDATE_ALLOCATION',
  REMOVE_ALLOCATION: 'REMOVE_ALLOCATION',
  SUBMIT: 'SUBMIT',
  SUBMIT_SUPPLIER: 'SUBMIT_SUPPLIER',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  CREATE_PURCHASE_ORDER: 'CREATE_PURCHASE_ORDER',
  CONFIRM_PURCHASE_ORDER: 'CONFIRM_PURCHASE_ORDER',
  CREATE_INBOUND_DELIVERY: 'CREATE_INBOUND_DELIVERY',
  CREATE_GOODS_RECEIPT: 'CREATE_GOODS_RECEIPT',
  POST_GOODS_RECEIPT: 'POST_GOODS_RECEIPT',
  CREATE_SUPPLIER_INVOICE: 'CREATE_SUPPLIER_INVOICE',
  POST_SUPPLIER_INVOICE: 'POST_SUPPLIER_INVOICE',
  CANCEL_SUPPLIER_INVOICE: 'CANCEL_SUPPLIER_INVOICE',
  CREATE_RECEIVE_WITH_INVOICE: 'CREATE_RECEIVE_WITH_INVOICE',
  POST_RECEIVE_WITH_INVOICE: 'POST_RECEIVE_WITH_INVOICE',
  DISCARD_RECEIVE_WITH_INVOICE: 'DISCARD_RECEIVE_WITH_INVOICE',
  CLOSE_SUPPLIER: 'CLOSE_SUPPLIER',
  COMPLETE: 'COMPLETE',
} as const;

export type PurchaseEventAction = (typeof PurchaseEventActionValues)[keyof typeof PurchaseEventActionValues];

export const PurchaseEventKindValues = {
  STAGE: 'STAGE',
  ITEMS: 'ITEMS',
  QUOTATIONS: 'QUOTATIONS',
  SOURCING: 'SOURCING',
  PROCURING: 'PROCURING',
  INVOICES: 'INVOICES',
} as const;

export type PurchaseEventKind = (typeof PurchaseEventKindValues)[keyof typeof PurchaseEventKindValues];

export const PurchaseEventKindActions: Record<PurchaseEventKind, PurchaseEventAction[]> = {
  STAGE: [
    PurchaseEventActionValues.SUBMIT_ITEMS,
    PurchaseEventActionValues.COMPLETE_QUOTATIONS,
    PurchaseEventActionValues.SUBMIT,
    PurchaseEventActionValues.COMPLETE,
    PurchaseEventActionValues.CANCEL,
  ],
  ITEMS: [
    PurchaseEventActionValues.CREATE,
    PurchaseEventActionValues.UPDATE,
    PurchaseEventActionValues.ADD_ITEM,
    PurchaseEventActionValues.UPDATE_ITEM,
    PurchaseEventActionValues.REMOVE_ITEM,
  ],
  QUOTATIONS: [PurchaseEventActionValues.REQUEST_QUOTATION],
  SOURCING: [
    PurchaseEventActionValues.ADD_ALLOCATION,
    PurchaseEventActionValues.UPDATE_ALLOCATION,
    PurchaseEventActionValues.REMOVE_ALLOCATION,
    PurchaseEventActionValues.SUBMIT_SUPPLIER,
    PurchaseEventActionValues.APPROVE,
    PurchaseEventActionValues.REJECT,
  ],
  PROCURING: [
    PurchaseEventActionValues.CREATE_PURCHASE_ORDER,
    PurchaseEventActionValues.CONFIRM_PURCHASE_ORDER,
    PurchaseEventActionValues.CREATE_INBOUND_DELIVERY,
    PurchaseEventActionValues.CREATE_GOODS_RECEIPT,
    PurchaseEventActionValues.POST_GOODS_RECEIPT,
    PurchaseEventActionValues.CLOSE_SUPPLIER,
  ],
  INVOICES: [
    PurchaseEventActionValues.CREATE_SUPPLIER_INVOICE,
    PurchaseEventActionValues.POST_SUPPLIER_INVOICE,
    PurchaseEventActionValues.CANCEL_SUPPLIER_INVOICE,
    PurchaseEventActionValues.CREATE_RECEIVE_WITH_INVOICE,
    PurchaseEventActionValues.POST_RECEIVE_WITH_INVOICE,
    PurchaseEventActionValues.DISCARD_RECEIVE_WITH_INVOICE,
  ],
};

export const PurchaseEventDocumentTypeValues = {
  SUPPLIER_QUOTATION: 'SUPPLIER_QUOTATION',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  INBOUND_DELIVERY: 'INBOUND_DELIVERY',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
} as const;

export type PurchaseEventDocumentType =
  (typeof PurchaseEventDocumentTypeValues)[keyof typeof PurchaseEventDocumentTypeValues];

export class PurchaseEventDto {
  id: string;
  action: string;
  purchaseSupplierId: string | null;
  supplierName: string | null;
  stepBefore: string | null;
  stepAfter: string | null;
  documentType: string | null;
  documentId: string | null;
  reason: string | null;
  actorId: string | null;
  createdAt: string;

  static from(row: PurchaseEventRow): PurchaseEventDto {
    const dto = new PurchaseEventDto();
    dto.id = row.id;
    dto.action = row.action;
    dto.purchaseSupplierId = row.purchaseSupplierId;
    dto.supplierName = row.supplierName;
    dto.stepBefore = row.stepBefore;
    dto.stepAfter = row.stepAfter;
    dto.documentType = row.documentType;
    dto.documentId = row.documentId;
    dto.reason = row.reason;
    dto.actorId = row.actorId;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
