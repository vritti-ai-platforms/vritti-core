import { coreSchema } from './core-schema';

export const catalogItemTypeEnum = coreSchema.enum('catalog_item_type', ['PRODUCT', 'SERVICE']);
export const modifierSelectionTypeEnum = coreSchema.enum('modifier_selection_type', ['SINGLE', 'MULTI']);

export const orderSourceEnum = coreSchema.enum('order_source', ['ONLINE', 'WALK_IN']);
export const orderStatusEnum = coreSchema.enum('order_status', [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
]);
export const orderItemStatusEnum = coreSchema.enum('order_item_status', [
  'PENDING',
  'PREPARING',
  'READY',
  'SERVED',
  'CANCELLED',
]);
export const paymentMethodEnum = coreSchema.enum('payment_method', ['CASH', 'UPI', 'CARD', 'WALLET', 'UNPAID']);
export const invoiceStatusEnum = coreSchema.enum('invoice_status', ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED']);

export type CatalogItemType = (typeof catalogItemTypeEnum.enumValues)[number];
export type ModifierSelectionType = (typeof modifierSelectionTypeEnum.enumValues)[number];

export const CatalogItemTypeValues = {
  PRODUCT: 'PRODUCT' as const,
  SERVICE: 'SERVICE' as const,
};

export const ModifierSelectionTypeValues = {
  SINGLE: 'SINGLE' as const,
  MULTI: 'MULTI' as const,
};

// TypeScript type exports for use in DTOs and services
export type OrderSource = (typeof orderSourceEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type OrderItemStatus = (typeof orderItemStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

// Runtime enum value objects for use in code
export const OrderSourceValues = {
  ONLINE: 'ONLINE' as const,
  WALK_IN: 'WALK_IN' as const,
};

export const OrderStatusValues = {
  PENDING: 'PENDING' as const,
  ACCEPTED: 'ACCEPTED' as const,
  PREPARING: 'PREPARING' as const,
  READY: 'READY' as const,
  COMPLETED: 'COMPLETED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export const OrderItemStatusValues = {
  PENDING: 'PENDING' as const,
  PREPARING: 'PREPARING' as const,
  READY: 'READY' as const,
  SERVED: 'SERVED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export const PaymentMethodValues = {
  CASH: 'CASH' as const,
  UPI: 'UPI' as const,
  CARD: 'CARD' as const,
  WALLET: 'WALLET' as const,
  UNPAID: 'UNPAID' as const,
};

export const InvoiceStatusValues = {
  DRAFT: 'DRAFT' as const,
  ISSUED: 'ISSUED' as const,
  PAID: 'PAID' as const,
  CANCELLED: 'CANCELLED' as const,
};

export const fieldTypeEnum = coreSchema.enum('field_type', ['text', 'number', 'boolean', 'select']);
export const FieldTypeValues = { TEXT: 'text', NUMBER: 'number', BOOLEAN: 'boolean', SELECT: 'select' } as const;
export type FieldType = (typeof fieldTypeEnum.enumValues)[number];

export const taxRateTypeEnum = coreSchema.enum('tax_rate_type', ['inclusive', 'exclusive']);
export const TaxRateTypeValues = { INCLUSIVE: 'inclusive', EXCLUSIVE: 'exclusive' } as const;
export type TaxRateType = (typeof taxRateTypeEnum.enumValues)[number];

export const inventoryItemTypeEnum = coreSchema.enum('inventory_item_type', ['MATERIAL', 'PRODUCT']);
export const InventoryItemTypeValues = { MATERIAL: 'MATERIAL' as const, PRODUCT: 'PRODUCT' as const };
export type InventoryItemType = (typeof inventoryItemTypeEnum.enumValues)[number];

export const inventoryLedgerTypeEnum = coreSchema.enum('inventory_ledger_type', [
  'GOODS_RECEIPT',
  'ORDER_RESERVE',
  'ORDER_DEDUCT',
  'ORDER_CANCEL',
  'ADJUSTMENT',
  'CONVERSION_INPUT',
  'CONVERSION_OUTPUT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
]);
export const InventoryLedgerTypeValues = {
  GOODS_RECEIPT: 'GOODS_RECEIPT' as const,
  ORDER_RESERVE: 'ORDER_RESERVE' as const,
  ORDER_DEDUCT: 'ORDER_DEDUCT' as const,
  ORDER_CANCEL: 'ORDER_CANCEL' as const,
  ADJUSTMENT: 'ADJUSTMENT' as const,
  CONVERSION_INPUT: 'CONVERSION_INPUT' as const,
  CONVERSION_OUTPUT: 'CONVERSION_OUTPUT' as const,
  TRANSFER_OUT: 'TRANSFER_OUT' as const,
  TRANSFER_IN: 'TRANSFER_IN' as const,
};
export type InventoryLedgerType = (typeof inventoryLedgerTypeEnum.enumValues)[number];
