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
