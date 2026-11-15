export const PURCHASE_STEPS = ['REQUESTING', 'QUOTING', 'SOURCING', 'PROCURING'] as const;
export type PurchaseStep = (typeof PURCHASE_STEPS)[number];

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
  'CANCEL',
  'EDIT_ITEMS',
  'SUBMIT_ITEMS',
  'REQUEST_QUOTATION',
  'COMPLETE_QUOTATIONS',
  'EDIT_ALLOCATIONS',
  'SUBMIT',
] as const;
export type PurchaseAction = (typeof PURCHASE_ACTIONS)[number];

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
] as const;
export type PurchaseLegAction = (typeof PURCHASE_LEG_ACTIONS)[number];
