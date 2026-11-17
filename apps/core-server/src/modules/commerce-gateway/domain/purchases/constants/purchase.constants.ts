export const PURCHASE_STATUSES = ['OPEN', 'COMPLETED', 'CANCELLED'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const PURCHASE_TYPES = [
  'DIRECT_PURCHASE',
  'DIRECT_RECEIPT',
  'ORDER_INVOICE_WITH_GOODS',
  'STANDARD',
  'ANNOUNCED',
  'PREPAID',
  'SELF_INVOICING',
] as const;
export type PurchaseType = (typeof PURCHASE_TYPES)[number];

export const PURCHASE_LEG_STEPS = [
  'SOURCING',
  'APPROVAL',
  'PURCHASE_ORDER',
  'INBOUND_DELIVERY',
  'GOODS_RECEIPT',
  'RECEIVE_WITH_INVOICE',
  'SUPPLIER_INVOICE',
  'APPROVE_INVOICE',
  'CLOSED',
] as const;
export type PurchaseLegStep = (typeof PURCHASE_LEG_STEPS)[number];

export const PURCHASE_LEG_STATUSES = ['OPEN', 'CLOSED', 'CANCELLED'] as const;
export type PurchaseLegStatus = (typeof PURCHASE_LEG_STATUSES)[number];

export const PURCHASE_ITEM_SOURCES = ['MANUAL'] as const;
export type PurchaseItemSource = (typeof PURCHASE_ITEM_SOURCES)[number];

export const PURCHASE_ACTIONS = [
  'EDIT',
  'EDIT_ITEMS',
  'REQUEST_QUOTATION',
  'EDIT_ALLOCATIONS',
  'SUBMIT',
  'CLOSE',
  'CANCEL',
  'DELETE',
] as const;
export type PurchaseAction = (typeof PURCHASE_ACTIONS)[number];

export const PURCHASE_ITEM_PROBLEM_CODES = ['PURCHASING_BLOCKED'] as const;
export type PurchaseItemProblemCode = (typeof PURCHASE_ITEM_PROBLEM_CODES)[number];

export const PURCHASE_ITEM_DOCUMENT_TYPES = [
  'PURCHASE_ORDER',
  'INBOUND_DELIVERY',
  'GOODS_RECEIPT',
  'SUPPLIER_INVOICE',
] as const;
export type PurchaseItemDocumentType = (typeof PURCHASE_ITEM_DOCUMENT_TYPES)[number];

export const PURCHASE_LEG_ACTIONS = [
  'EDIT_ALLOCATIONS',
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'CREATE_PURCHASE_ORDER',
  'CONFIRM_PURCHASE_ORDER',
  'CREATE_INBOUND_DELIVERY',
  'CREATE_GOODS_RECEIPT',
  'RECEIVE_WITH_INVOICE',
  'CREATE_SUPPLIER_INVOICE',
  'CLOSE_SUPPLIER',
  'CANCEL_SUPPLIER',
] as const;
export type PurchaseLegAction = (typeof PURCHASE_LEG_ACTIONS)[number];

export const PURCHASE_SUMMARIES = ['NOT_STARTED', 'SOURCING', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED'] as const;
export type PurchaseSummary = (typeof PURCHASE_SUMMARIES)[number];

export const PURCHASE_ITEM_BUCKETS = [
  'NOT_ALLOCATED',
  'NEEDS_QUOTATIONS',
  'ALLOCATED',
  'ORDERED',
  'IN_TRANSIT',
  'RECEIVED',
  'INVOICED',
] as const;
export type PurchaseItemBucket = (typeof PURCHASE_ITEM_BUCKETS)[number];

export const CANCELLED_QUANTITIES = ['RETURN', 'DROP'] as const;
export type CancelledQuantity = (typeof CANCELLED_QUANTITIES)[number];
