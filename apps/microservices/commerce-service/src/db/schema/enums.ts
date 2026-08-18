import { commerceSchema } from './commerce-schema';

export const modifierSelectionTypeEnum = commerceSchema.enum('modifier_selection_type', ['SINGLE', 'MULTI']);

export const salesChannelKindEnum = commerceSchema.enum('sales_channel_kind', [
  'IN_STORE',
  'ONLINE',
  'ZOMATO',
  'SWIGGY',
  'OTHER',
]);
export const fulfilmentTypeEnum = commerceSchema.enum('fulfilment_type', ['STOCK', 'SERVICE', 'COMPOSITE']);

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

export const orderSourceEnum = commerceSchema.enum('order_source', ['ONLINE', 'WALK_IN']);
export const orderStatusEnum = commerceSchema.enum('order_status', [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
]);
export const orderItemStatusEnum = commerceSchema.enum('order_item_status', [
  'PENDING',
  'PREPARING',
  'READY',
  'SERVED',
  'CANCELLED',
]);
export const paymentMethodEnum = commerceSchema.enum('payment_method', [
  'CASH',
  'CARD',
  'UPI',
  'BANK_TRANSFER',
  'WALLET',
  'ONLINE',
]);
export const invoiceStatusEnum = commerceSchema.enum('invoice_status', [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'VOID',
]);

export const invoiceTypeEnum = commerceSchema.enum('invoice_type', ['PAYABLE', 'RECEIVABLE']);
export const invoicePartyTypeEnum = commerceSchema.enum('invoice_party_type', ['SUPPLIER', 'CUSTOMER', 'AGGREGATOR']);
export const paymentStatusEnum = commerceSchema.enum('payment_status', ['COMPLETED', 'FAILED', 'REFUNDED']);
export const creditNoteTypeEnum = commerceSchema.enum('credit_note_type', ['PAYABLE', 'RECEIVABLE']);
export const creditNoteStatusEnum = commerceSchema.enum('credit_note_status', [
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

export const fieldTypeEnum = commerceSchema.enum('field_type', ['text', 'number', 'boolean', 'select']);
export const FieldTypeValues = { TEXT: 'text', NUMBER: 'number', BOOLEAN: 'boolean', SELECT: 'select' } as const;
export type FieldType = (typeof fieldTypeEnum.enumValues)[number];

export const locationRoleEnum = commerceSchema.enum('location_role', ['STORAGE', 'RESERVED_STORAGE', 'ZONE']);
export const LocationRoleValues = {
  STORAGE: 'STORAGE' as const,
  RESERVED_STORAGE: 'RESERVED_STORAGE' as const,
  ZONE: 'ZONE' as const,
};
export type LocationRole = (typeof locationRoleEnum.enumValues)[number];

// A GROUP holds sub-categories (no items); a CATEGORY is a leaf that holds inventory items.
export const categoryRoleEnum = commerceSchema.enum('category_role', ['GROUP', 'CATEGORY']);
export const CategoryRoleValues = {
  GROUP: 'GROUP' as const,
  CATEGORY: 'CATEGORY' as const,
};
export type CategoryRole = (typeof categoryRoleEnum.enumValues)[number];

export const taxIdTypeEnum = commerceSchema.enum('tax_id_type', ['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER']);
export const TaxIdTypeValues = {
  GST: 'GST' as const,
  VAT: 'VAT' as const,
  EIN: 'EIN' as const,
  SALES_TAX: 'SALES_TAX' as const,
  OTHER: 'OTHER' as const,
};
export type TaxIdType = (typeof taxIdTypeEnum.enumValues)[number];

export const inventoryItemTypeEnum = commerceSchema.enum('inventory_item_type', [
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

export const inventoryTrackingEnum = commerceSchema.enum('inventory_tracking', [
  'quantity',
  'lot',
  'lot_serial',
  'serial',
]);
export const InventoryTrackingValues = {
  QUANTITY: 'quantity' as const,
  LOT: 'lot' as const,
  SERIAL: 'serial' as const,
  LOT_SERIAL: 'lot_serial' as const,
};
export type InventoryTracking = (typeof inventoryTrackingEnum.enumValues)[number];

export const inventoryPickStrategyEnum = commerceSchema.enum('inventory_pick_strategy', ['none', 'fifo', 'fefo']);
export const InventoryPickStrategyValues = {
  NONE: 'none' as const,
  FIFO: 'fifo' as const,
  FEFO: 'fefo' as const,
};
export type InventoryPickStrategy = (typeof inventoryPickStrategyEnum.enumValues)[number];

export const serialStatusEnum = commerceSchema.enum('quant_item_status', ['AVAILABLE', 'RESERVED', 'CONSUMED']);
export const SerialStatusValues = {
  AVAILABLE: 'AVAILABLE' as const,
  RESERVED: 'RESERVED' as const,
  CONSUMED: 'CONSUMED' as const,
};
export type SerialStatus = (typeof serialStatusEnum.enumValues)[number];

export const inventoryItemLedgerTypeEnum = commerceSchema.enum('inventory_item_ledger_type', [
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

export const inventoryItemLedgerReferenceTypeEnum = commerceSchema.enum('inventory_item_ledger_reference_type', [
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

export const exchangeRateTypeEnum = commerceSchema.enum('exchange_rate_type', ['FIXED', 'VARIABLE']);
export const ExchangeRateTypeValues = {
  FIXED: 'FIXED' as const,
  VARIABLE: 'VARIABLE' as const,
};
export type ExchangeRateType = (typeof exchangeRateTypeEnum.enumValues)[number];

export const purchaseOrderStatusEnum = commerceSchema.enum('purchase_order_status', [
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

export const goodsReceiptStatusEnum = commerceSchema.enum('goods_receipt_status', ['DRAFT', 'PUBLISHED']);
export const GoodsReceiptStatusValues = {
  DRAFT: 'DRAFT' as const,
  PUBLISHED: 'PUBLISHED' as const,
};
export type GoodsReceiptStatus = (typeof goodsReceiptStatusEnum.enumValues)[number];

export const conversionStatusEnum = commerceSchema.enum('conversion_status', [
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

export const stockAdjustmentTypeEnum = commerceSchema.enum('stock_adjustment_type', [
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

export const stockAdjustmentStatusEnum = commerceSchema.enum('stock_adjustment_status', ['DRAFT', 'PUBLISHED']);
export const StockAdjustmentStatusValues = {
  DRAFT: 'DRAFT' as const,
  PUBLISHED: 'PUBLISHED' as const,
};
export type StockAdjustmentStatus = (typeof stockAdjustmentStatusEnum.enumValues)[number];

export const stockTransferStatusEnum = commerceSchema.enum('stock_transfer_status', [
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

export const orderTypeEnum = commerceSchema.enum('order_type', ['DINE_IN', 'TAKEAWAY', 'DELIVERY']);
export const OrderTypeValues = {
  DINE_IN: 'DINE_IN' as const,
  TAKEAWAY: 'TAKEAWAY' as const,
  DELIVERY: 'DELIVERY' as const,
};
export type OrderType = (typeof orderTypeEnum.enumValues)[number];

export const costCategoryKindEnum = commerceSchema.enum('cost_category_kind', [
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

export const costSourceTypeEnum = commerceSchema.enum('cost_source_type', [
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

export const costDistributionMethodEnum = commerceSchema.enum('cost_distribution_method', [
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

export const taxAuthorityLevelEnum = commerceSchema.enum('tax_authority_level', [
  'FEDERAL',
  'STATE',
  'COUNTY',
  'CITY',
  'SPECIAL',
]);
export const TaxAuthorityLevelValues = {
  FEDERAL: 'FEDERAL' as const,
  STATE: 'STATE' as const,
  COUNTY: 'COUNTY' as const,
  CITY: 'CITY' as const,
  SPECIAL: 'SPECIAL' as const,
};
export type TaxAuthorityLevel = (typeof taxAuthorityLevelEnum.enumValues)[number];

export const partyTypeEnum = commerceSchema.enum('party_type', ['PERSON', 'COMPANY']);
export const PartyTypeValues = {
  PERSON: 'PERSON' as const,
  COMPANY: 'COMPANY' as const,
};
export type PartyType = (typeof partyTypeEnum.enumValues)[number];

export const govtIdTypeEnum = commerceSchema.enum('govt_id_type', [
  'PAN',
  'AADHAAR',
  'PASSPORT',
  'DRIVING_LICENSE',
  'VOTER_ID',
  'CIVIL_ID',
  'NATIONAL_ID',
]);
export type GovtIdType = (typeof govtIdTypeEnum.enumValues)[number];

export const partyIdentifierTypeEnum = commerceSchema.enum('party_identifier_type', [
  'PAN',
  'AADHAAR',
  'PASSPORT',
  'DRIVING_LICENSE',
  'VOTER_ID',
  'CIVIL_ID',
  'NATIONAL_ID',
  'DUNS',
  'LEI',
  'CIN',
]);
export const PartyIdentifierTypeValues = {
  PAN: 'PAN' as const,
  AADHAAR: 'AADHAAR' as const,
  PASSPORT: 'PASSPORT' as const,
  DRIVING_LICENSE: 'DRIVING_LICENSE' as const,
  VOTER_ID: 'VOTER_ID' as const,
  CIVIL_ID: 'CIVIL_ID' as const,
  NATIONAL_ID: 'NATIONAL_ID' as const,
  DUNS: 'DUNS' as const,
  LEI: 'LEI' as const,
  CIN: 'CIN' as const,
};
export type PartyIdentifierType = (typeof partyIdentifierTypeEnum.enumValues)[number];

export const PersonIdentifierTypes: PartyIdentifierType[] = [
  'PAN',
  'AADHAAR',
  'PASSPORT',
  'DRIVING_LICENSE',
  'VOTER_ID',
  'CIVIL_ID',
  'NATIONAL_ID',
];
export const OrganizationIdentifierTypes: PartyIdentifierType[] = ['PAN', 'CIN', 'LEI', 'DUNS'];

export function isIdentifierTypeApplicable(partyType: PartyType, idType: PartyIdentifierType): boolean {
  const applicable = partyType === 'PERSON' ? PersonIdentifierTypes : OrganizationIdentifierTypes;
  return applicable.includes(idType);
}

export const taxRegistrationTypeEnum = commerceSchema.enum('tax_registration_type', [
  'GSTIN',
  'VAT',
  'TIN',
  'PAN',
  'OTHER',
]);
export const TaxRegistrationTypeValues = {
  GSTIN: 'GSTIN' as const,
  VAT: 'VAT' as const,
  TIN: 'TIN' as const,
  PAN: 'PAN' as const,
  OTHER: 'OTHER' as const,
};
export type TaxRegistrationType = (typeof taxRegistrationTypeEnum.enumValues)[number];

export const taxJurisdictionLevelEnum = commerceSchema.enum('tax_jurisdiction_level', [
  'COUNTRY',
  'STATE',
  'COUNTY',
  'CITY',
  'DISTRICT',
]);
export const TaxJurisdictionLevelValues = {
  COUNTRY: 'COUNTRY' as const,
  STATE: 'STATE' as const,
  COUNTY: 'COUNTY' as const,
  CITY: 'CITY' as const,
  DISTRICT: 'DISTRICT' as const,
};
export type TaxJurisdictionLevel = (typeof taxJurisdictionLevelEnum.enumValues)[number];

export const partyLicenseTypeEnum = commerceSchema.enum('party_license_type', ['DRUG', 'EXCISE', 'FSSAI', 'OTHER']);
export const PartyLicenseTypeValues = {
  DRUG: 'DRUG' as const,
  EXCISE: 'EXCISE' as const,
  FSSAI: 'FSSAI' as const,
  OTHER: 'OTHER' as const,
};
export type PartyLicenseType = (typeof partyLicenseTypeEnum.enumValues)[number];

export const supplierPriceSourceEnum = commerceSchema.enum('supplier_price_source', ['QUOTATION', 'MANUAL', 'IMPORT']);
export const SupplierPriceSourceValues = {
  QUOTATION: 'QUOTATION' as const,
  MANUAL: 'MANUAL' as const,
  IMPORT: 'IMPORT' as const,
};
export type SupplierPriceSource = (typeof supplierPriceSourceEnum.enumValues)[number];

export const partyFunctionTypeEnum = commerceSchema.enum('party_function_type', [
  'REGISTERED',
  'BILLING',
  'SHIPPING',
  'ORDERING',
  'ORDER',
  'ACCOUNTS',
  'LOGISTICS',
  'ESCALATION',
]);
export const PartyFunctionTypeValues = {
  REGISTERED: 'REGISTERED' as const,
  BILLING: 'BILLING' as const,
  SHIPPING: 'SHIPPING' as const,
  ORDERING: 'ORDERING' as const,
  ORDER: 'ORDER' as const,
  ACCOUNTS: 'ACCOUNTS' as const,
  LOGISTICS: 'LOGISTICS' as const,
  ESCALATION: 'ESCALATION' as const,
};
export type PartyFunctionType = (typeof partyFunctionTypeEnum.enumValues)[number];

/**
 * How a party is reached — plus one channel that is not a contact method at all.
 *
 * `WEB_APP` carries an external reference rather than an address: its `value` is
 * the id of the person's account in a web app the organization runs, so core can
 * resolve that account back to this party. It is never contactable, never
 * primary (a CHECK enforces that), and must be filtered out of anything that
 * reads communications to find somewhere to send a message.
 *
 * Adding a value here is permanent — Postgres has no `ALTER TYPE … DROP VALUE`.
 */
export const partyCommunicationChannelEnum = commerceSchema.enum('party_communication_channel', [
  'EMAIL',
  'PHONE',
  'WEB_APP',
]);
export const PartyCommunicationChannelValues = {
  EMAIL: 'EMAIL' as const,
  PHONE: 'PHONE' as const,
  WEB_APP: 'WEB_APP' as const,
};
export type PartyCommunicationChannel = (typeof partyCommunicationChannelEnum.enumValues)[number];

/**
 * The channels that are an actual way to reach someone.
 *
 * An allowlist rather than "everything except WEB_APP" on purpose: the next
 * external-reference channel added to the enum is then non-contactable by
 * default, instead of being accidentally contactable until somebody notices.
 */
export const CONTACTABLE_CHANNELS = [
  PartyCommunicationChannelValues.EMAIL,
  PartyCommunicationChannelValues.PHONE,
] as const;

export const messagingAppEnum = commerceSchema.enum('messaging_app', [
  'WHATSAPP',
  'TELEGRAM',
  'SIGNAL',
  'IMO',
  'VIBER',
  'WECHAT',
]);
export const MessagingAppValues = {
  WHATSAPP: 'WHATSAPP' as const,
  TELEGRAM: 'TELEGRAM' as const,
  SIGNAL: 'SIGNAL' as const,
  IMO: 'IMO' as const,
  VIBER: 'VIBER' as const,
  WECHAT: 'WECHAT' as const,
};
export type MessagingApp = (typeof messagingAppEnum.enumValues)[number];

export const socialPlatformEnum = commerceSchema.enum('social_platform', [
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'X',
  'YOUTUBE',
  'TIKTOK',
  'WEBSITE',
]);
export const SocialPlatformValues = {
  INSTAGRAM: 'INSTAGRAM' as const,
  FACEBOOK: 'FACEBOOK' as const,
  LINKEDIN: 'LINKEDIN' as const,
  X: 'X' as const,
  YOUTUBE: 'YOUTUBE' as const,
  TIKTOK: 'TIKTOK' as const,
  WEBSITE: 'WEBSITE' as const,
};
export type SocialPlatform = (typeof socialPlatformEnum.enumValues)[number];
