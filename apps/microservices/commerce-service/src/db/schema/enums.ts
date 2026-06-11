import { coreSchema } from './core-schema';

export const modifierSelectionTypeEnum = coreSchema.enum('modifier_selection_type', ['SINGLE', 'MULTI']);

export const salesChannelKindEnum = coreSchema.enum('sales_channel_kind', [
  'IN_STORE',
  'ONLINE',
  'ZOMATO',
  'SWIGGY',
  'OTHER',
]);
export const fulfilmentTypeEnum = coreSchema.enum('fulfilment_type', ['STOCK', 'SERVICE', 'COMPOSITE']);

export type SalesChannelKind = (typeof salesChannelKindEnum.enumValues)[number];
export type FulfilmentType = (typeof fulfilmentTypeEnum.enumValues)[number];
export const SalesChannelKindValues = {
  IN_STORE: 'IN_STORE' as const,
  ONLINE: 'ONLINE' as const,
  ZOMATO: 'ZOMATO' as const,
  SWIGGY: 'SWIGGY' as const,
  OTHER: 'OTHER' as const,
};
export const FulfilmentTypeValues = {
  STOCK: 'STOCK' as const,
  SERVICE: 'SERVICE' as const,
  COMPOSITE: 'COMPOSITE' as const,
};

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
export const paymentMethodEnum = coreSchema.enum('payment_method', [
  'CASH',
  'CARD',
  'UPI',
  'BANK_TRANSFER',
  'WALLET',
  'ONLINE',
]);
export const invoiceStatusEnum = coreSchema.enum('invoice_status', [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'VOID',
]);

export const invoiceTypeEnum = coreSchema.enum('invoice_type', ['PAYABLE', 'RECEIVABLE']);
export const invoicePartyTypeEnum = coreSchema.enum('invoice_party_type', ['SUPPLIER', 'CUSTOMER', 'AGGREGATOR']);
export const paymentStatusEnum = coreSchema.enum('payment_status', ['COMPLETED', 'FAILED', 'REFUNDED']);
export const creditNoteTypeEnum = coreSchema.enum('credit_note_type', ['PAYABLE', 'RECEIVABLE']);
export const creditNoteStatusEnum = coreSchema.enum('credit_note_status', [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_APPLIED',
  'FULLY_APPLIED',
]);

export type ModifierSelectionType = (typeof modifierSelectionTypeEnum.enumValues)[number];

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
export type InvoiceType = (typeof invoiceTypeEnum.enumValues)[number];
export type InvoicePartyType = (typeof invoicePartyTypeEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type CreditNoteType = (typeof creditNoteTypeEnum.enumValues)[number];
export type CreditNoteStatus = (typeof creditNoteStatusEnum.enumValues)[number];

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
  CARD: 'CARD' as const,
  UPI: 'UPI' as const,
  BANK_TRANSFER: 'BANK_TRANSFER' as const,
  WALLET: 'WALLET' as const,
  ONLINE: 'ONLINE' as const,
};

export const InvoiceStatusValues = {
  DRAFT: 'DRAFT' as const,
  ISSUED: 'ISSUED' as const,
  PARTIALLY_PAID: 'PARTIALLY_PAID' as const,
  PAID: 'PAID' as const,
  OVERDUE: 'OVERDUE' as const,
  VOID: 'VOID' as const,
};

export const InvoiceTypeValues = {
  PAYABLE: 'PAYABLE' as const,
  RECEIVABLE: 'RECEIVABLE' as const,
};

export const InvoicePartyTypeValues = {
  SUPPLIER: 'SUPPLIER' as const,
  CUSTOMER: 'CUSTOMER' as const,
  AGGREGATOR: 'AGGREGATOR' as const,
};

export const PaymentStatusValues = {
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
  REFUNDED: 'REFUNDED' as const,
};

export const CreditNoteTypeValues = {
  PAYABLE: 'PAYABLE' as const,
  RECEIVABLE: 'RECEIVABLE' as const,
};

export const CreditNoteStatusValues = {
  DRAFT: 'DRAFT' as const,
  ISSUED: 'ISSUED' as const,
  PARTIALLY_APPLIED: 'PARTIALLY_APPLIED' as const,
  FULLY_APPLIED: 'FULLY_APPLIED' as const,
};

export const fieldTypeEnum = coreSchema.enum('field_type', ['text', 'number', 'boolean', 'select']);
export const FieldTypeValues = { TEXT: 'text', NUMBER: 'number', BOOLEAN: 'boolean', SELECT: 'select' } as const;
export type FieldType = (typeof fieldTypeEnum.enumValues)[number];

export const locationRoleEnum = coreSchema.enum('location_role', ['STORAGE', 'RESERVED_STORAGE', 'ZONE']);
export const LocationRoleValues = {
  STORAGE: 'STORAGE' as const,
  RESERVED_STORAGE: 'RESERVED_STORAGE' as const,
  ZONE: 'ZONE' as const,
};
export type LocationRole = (typeof locationRoleEnum.enumValues)[number];

// A GROUP holds sub-categories (no items); a CATEGORY is a leaf that holds inventory items.
export const categoryRoleEnum = coreSchema.enum('category_role', ['GROUP', 'CATEGORY']);
export const CategoryRoleValues = {
  GROUP: 'GROUP' as const,
  CATEGORY: 'CATEGORY' as const,
};
export type CategoryRole = (typeof categoryRoleEnum.enumValues)[number];

export const taxIdTypeEnum = coreSchema.enum('tax_id_type', ['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER']);
export const TaxIdTypeValues = {
  GST: 'GST' as const,
  VAT: 'VAT' as const,
  EIN: 'EIN' as const,
  SALES_TAX: 'SALES_TAX' as const,
  OTHER: 'OTHER' as const,
};
export type TaxIdType = (typeof taxIdTypeEnum.enumValues)[number];

export const inventoryItemTypeEnum = coreSchema.enum('inventory_item_type', [
  'RAW_MATERIAL',
  'SEMI_FINISHED',
  'FINISHED_GOOD',
  'PACKAGING',
  'CONSUMABLE',
]);
export const InventoryItemTypeValues = {
  RAW_MATERIAL: 'RAW_MATERIAL' as const,
  SEMI_FINISHED: 'SEMI_FINISHED' as const,
  FINISHED_GOOD: 'FINISHED_GOOD' as const,
  PACKAGING: 'PACKAGING' as const,
  CONSUMABLE: 'CONSUMABLE' as const,
};
export type InventoryItemType = (typeof inventoryItemTypeEnum.enumValues)[number];

export const inventoryTrackingEnum = coreSchema.enum('inventory_tracking', ['quantity', 'lot', 'lot_serial', 'serial']);
export const InventoryTrackingValues = {
  QUANTITY: 'quantity' as const,
  LOT: 'lot' as const,
  SERIAL: 'serial' as const,
  LOT_SERIAL: 'lot_serial' as const,
};
export type InventoryTracking = (typeof inventoryTrackingEnum.enumValues)[number];

export const inventoryPickStrategyEnum = coreSchema.enum('inventory_pick_strategy', ['none', 'fifo', 'fefo']);
export const InventoryPickStrategyValues = {
  NONE: 'none' as const,
  FIFO: 'fifo' as const,
  FEFO: 'fefo' as const,
};
export type InventoryPickStrategy = (typeof inventoryPickStrategyEnum.enumValues)[number];

export const serialStatusEnum = coreSchema.enum('quant_item_status', ['AVAILABLE', 'RESERVED', 'CONSUMED']);
export const SerialStatusValues = {
  AVAILABLE: 'AVAILABLE' as const,
  RESERVED: 'RESERVED' as const,
  CONSUMED: 'CONSUMED' as const,
};
export type SerialStatus = (typeof serialStatusEnum.enumValues)[number];

export const inventoryItemLedgerTypeEnum = coreSchema.enum('inventory_item_ledger_type', [
  'GOODS_RECEIPT',
  'ORDER_RESERVE',
  'ORDER_DEDUCT',
  'ORDER_CANCEL',
  'ADJUSTMENT',
  'CONVERSION_INPUT',
  'CONVERSION_OUTPUT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'OPENING_STOCK',
]);
export const InventoryItemLedgerTypeValues = {
  GOODS_RECEIPT: 'GOODS_RECEIPT' as const,
  ORDER_RESERVE: 'ORDER_RESERVE' as const,
  ORDER_DEDUCT: 'ORDER_DEDUCT' as const,
  ORDER_CANCEL: 'ORDER_CANCEL' as const,
  ADJUSTMENT: 'ADJUSTMENT' as const,
  CONVERSION_INPUT: 'CONVERSION_INPUT' as const,
  CONVERSION_OUTPUT: 'CONVERSION_OUTPUT' as const,
  TRANSFER_OUT: 'TRANSFER_OUT' as const,
  TRANSFER_IN: 'TRANSFER_IN' as const,
  OPENING_STOCK: 'OPENING_STOCK' as const,
};
export type InventoryItemLedgerType = (typeof inventoryItemLedgerTypeEnum.enumValues)[number];

export const inventoryItemLedgerReferenceTypeEnum = coreSchema.enum('inventory_item_ledger_reference_type', [
  'GOODS_RECEIPT',
  'STOCK_ADJUSTMENT',
  'CONVERSION',
  'STOCK_TRANSFER',
  'ORDER',
]);
export const InventoryItemLedgerReferenceTypeValues = {
  GOODS_RECEIPT: 'GOODS_RECEIPT' as const,
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT' as const,
  CONVERSION: 'CONVERSION' as const,
  STOCK_TRANSFER: 'STOCK_TRANSFER' as const,
  ORDER: 'ORDER' as const,
};
export type InventoryItemLedgerReferenceType = (typeof inventoryItemLedgerReferenceTypeEnum.enumValues)[number];

export const exchangeRateTypeEnum = coreSchema.enum('exchange_rate_type', ['FIXED', 'VARIABLE']);
export const ExchangeRateTypeValues = {
  FIXED: 'FIXED' as const,
  VARIABLE: 'VARIABLE' as const,
};
export type ExchangeRateType = (typeof exchangeRateTypeEnum.enumValues)[number];

export const purchaseOrderStatusEnum = coreSchema.enum('purchase_order_status', [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'DRAFT',
  'SENT',
  'CONFIRMED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CLOSED',
  'CANCELLED',
]);
export const PurchaseOrderStatusValues = {
  PENDING_APPROVAL: 'PENDING_APPROVAL' as const,
  APPROVED: 'APPROVED' as const,
  REJECTED: 'REJECTED' as const,
  DRAFT: 'DRAFT' as const,
  SENT: 'SENT' as const,
  CONFIRMED: 'CONFIRMED' as const,
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED' as const,
  RECEIVED: 'RECEIVED' as const,
  CLOSED: 'CLOSED' as const,
  CANCELLED: 'CANCELLED' as const,
};
export type PurchaseOrderStatus = (typeof purchaseOrderStatusEnum.enumValues)[number];

export const goodsReceiptStatusEnum = coreSchema.enum('goods_receipt_status', ['DRAFT', 'PUBLISHED']);
export const GoodsReceiptStatusValues = {
  DRAFT: 'DRAFT' as const,
  PUBLISHED: 'PUBLISHED' as const,
};
export type GoodsReceiptStatus = (typeof goodsReceiptStatusEnum.enumValues)[number];

export const conversionStatusEnum = coreSchema.enum('conversion_status', [
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
export const ConversionStatusValues = {
  DRAFT: 'DRAFT' as const,
  IN_PROGRESS: 'IN_PROGRESS' as const,
  COMPLETED: 'COMPLETED' as const,
  CANCELLED: 'CANCELLED' as const,
};
export type ConversionStatus = (typeof conversionStatusEnum.enumValues)[number];

export const stockAdjustmentTypeEnum = coreSchema.enum('stock_adjustment_type', [
  'WASTE',
  'DAMAGE',
  'THEFT',
  'EXPIRED',
  'CORRECTION',
  'OPENING_STOCK',
]);
export const StockAdjustmentTypeValues = {
  WASTE: 'WASTE' as const,
  DAMAGE: 'DAMAGE' as const,
  THEFT: 'THEFT' as const,
  EXPIRED: 'EXPIRED' as const,
  CORRECTION: 'CORRECTION' as const,
  OPENING_STOCK: 'OPENING_STOCK' as const,
};
export type StockAdjustmentType = (typeof stockAdjustmentTypeEnum.enumValues)[number];

export const stockAdjustmentStatusEnum = coreSchema.enum('stock_adjustment_status', ['DRAFT', 'PUBLISHED']);
export const StockAdjustmentStatusValues = {
  DRAFT: 'DRAFT' as const,
  PUBLISHED: 'PUBLISHED' as const,
};
export type StockAdjustmentStatus = (typeof stockAdjustmentStatusEnum.enumValues)[number];

export const stockTransferStatusEnum = coreSchema.enum('stock_transfer_status', [
  'REQUESTED',
  'IN_TRANSIT',
  'RECEIVED',
  'CANCELLED',
]);
export const StockTransferStatusValues = {
  REQUESTED: 'REQUESTED' as const,
  IN_TRANSIT: 'IN_TRANSIT' as const,
  RECEIVED: 'RECEIVED' as const,
  CANCELLED: 'CANCELLED' as const,
};
export type StockTransferStatus = (typeof stockTransferStatusEnum.enumValues)[number];

export const orderTypeEnum = coreSchema.enum('order_type', ['DINE_IN', 'TAKEAWAY', 'DELIVERY']);
export const OrderTypeValues = {
  DINE_IN: 'DINE_IN' as const,
  TAKEAWAY: 'TAKEAWAY' as const,
  DELIVERY: 'DELIVERY' as const,
};
export type OrderType = (typeof orderTypeEnum.enumValues)[number];

export const costCategoryKindEnum = coreSchema.enum('cost_category_kind', [
  'ITEM',
  'FREIGHT',
  'DUTY',
  'INSURANCE',
  'SERVICE',
  'OTHER',
]);
export const CostCategoryKindValues = {
  ITEM: 'ITEM' as const,
  FREIGHT: 'FREIGHT' as const,
  DUTY: 'DUTY' as const,
  INSURANCE: 'INSURANCE' as const,
  SERVICE: 'SERVICE' as const,
  OTHER: 'OTHER' as const,
};
export type CostCategoryKind = (typeof costCategoryKindEnum.enumValues)[number];

export const costSourceTypeEnum = coreSchema.enum('cost_source_type', [
  'goods_receipt',
  'stock_adjustment',
  'stock_transfer',
  'manual_adjustment',
]);
export const CostSourceTypeValues = {
  GOODS_RECEIPT: 'goods_receipt' as const,
  STOCK_ADJUSTMENT: 'stock_adjustment' as const,
  STOCK_TRANSFER: 'stock_transfer' as const,
  MANUAL_ADJUSTMENT: 'manual_adjustment' as const,
};
export type CostSourceType = (typeof costSourceTypeEnum.enumValues)[number];

export const costDistributionMethodEnum = coreSchema.enum('cost_distribution_method', [
  'by_value',
  'by_quantity',
  'equal',
]);
export const CostDistributionMethodValues = {
  BY_VALUE: 'by_value' as const,
  BY_QUANTITY: 'by_quantity' as const,
  EQUAL: 'equal' as const,
};
export type CostDistributionMethod = (typeof costDistributionMethodEnum.enumValues)[number];
