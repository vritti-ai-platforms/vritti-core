import { commerceSchema } from './commerce-schema';

export const catalogChannelTypeEnum = commerceSchema.enum('catalog_channel_type', ['APP', 'POS', 'B2B']);
export const fulfilmentTypeEnum = commerceSchema.enum('fulfilment_type', ['STOCK', 'ASSEMBLY', 'COMPOSITE', 'SERVICE']);
export const catalogFilterModeEnum = commerceSchema.enum('catalog_filter_mode', ['STATIC', 'NARROWING']);

export type CatalogChannelType = (typeof catalogChannelTypeEnum.enumValues)[number];
export type FulfilmentType = (typeof fulfilmentTypeEnum.enumValues)[number];
export type CatalogFilterMode = (typeof catalogFilterModeEnum.enumValues)[number];

export const CatalogChannelTypeValues = {
  APP: 'APP' as const,
  POS: 'POS' as const,
  B2B: 'B2B' as const,
};
export const FulfilmentTypeValues = {
  STOCK: 'STOCK' as const,
  ASSEMBLY: 'ASSEMBLY' as const,
  COMPOSITE: 'COMPOSITE' as const,
  SERVICE: 'SERVICE' as const,
};

export const BOM_RULES = {
  [FulfilmentTypeValues.STOCK]: { min: 1, max: 1 },
  [FulfilmentTypeValues.ASSEMBLY]: { min: 1, max: Number.POSITIVE_INFINITY },
  [FulfilmentTypeValues.COMPOSITE]: { min: 1, max: Number.POSITIVE_INFINITY },
  [FulfilmentTypeValues.SERVICE]: { min: 0, max: Number.POSITIVE_INFINITY },
} as const;

export const orderSourceEnum = commerceSchema.enum('order_source', ['ONLINE', 'WALK_IN']);
// OPEN → PAID → CONVERTED; it ends unpaid as EXPIRED (its 30-minute window closed) or CANCELLED (the shopper cancelled
// or replaced it) — a late payment still converts either, unless the checkout was replaced
export const checkoutStatusEnum = commerceSchema.enum('checkout_status', [
  'OPEN',
  'PAID',
  'CONVERTED',
  'EXPIRED',
  'CANCELLED',
]);
export const orderStatusEnum = commerceSchema.enum('order_status', [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
]);

export type OrderSource = (typeof orderSourceEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type CheckoutStatus = (typeof checkoutStatusEnum.enumValues)[number];

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

export const CheckoutStatusValues = {
  OPEN: 'OPEN' as const,
  PAID: 'PAID' as const,
  CONVERTED: 'CONVERTED' as const,
  EXPIRED: 'EXPIRED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export const locationRoleEnum = commerceSchema.enum('location_role', ['STORAGE', 'RESERVED_STORAGE', 'ZONE']);
export const LocationRoleValues = {
  STORAGE: 'STORAGE' as const,
  RESERVED_STORAGE: 'RESERVED_STORAGE' as const,
  ZONE: 'ZONE' as const,
};
export type LocationRole = (typeof locationRoleEnum.enumValues)[number];

export const storageCapacityCheckEnum = commerceSchema.enum('storage_capacity_check', ['NONE', 'WARN', 'BLOCK']);
export type StorageCapacityCheck = (typeof storageCapacityCheckEnum.enumValues)[number];
export const StorageCapacityCheckValues = {
  NONE: 'NONE',
  WARN: 'WARN',
  BLOCK: 'BLOCK',
} as const satisfies Record<StorageCapacityCheck, StorageCapacityCheck>;

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
  'QUANTITY',
  'LOT',
  'LOT_SERIAL',
  'SERIAL',
]);
export type InventoryTracking = (typeof inventoryTrackingEnum.enumValues)[number];
export const InventoryTrackingValues = {
  QUANTITY: 'QUANTITY',
  LOT: 'LOT',
  SERIAL: 'SERIAL',
  LOT_SERIAL: 'LOT_SERIAL',
} as const satisfies Record<InventoryTracking, InventoryTracking>;

export const inventoryPickStrategyEnum = commerceSchema.enum('inventory_pick_strategy', ['NONE', 'FIFO', 'FEFO']);
export type InventoryPickStrategy = (typeof inventoryPickStrategyEnum.enumValues)[number];
export const InventoryPickStrategyValues = {
  NONE: 'NONE',
  FIFO: 'FIFO',
  FEFO: 'FEFO',
} as const satisfies Record<InventoryPickStrategy, InventoryPickStrategy>;

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

export const purchaseOrderStatusEnum = commerceSchema.enum('purchase_order_status', [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'DRAFT',
  'SENT',
  'CONFIRMED',
  'DELIVERY_COMPLETED',
  'CANCELLED',
]);
export const PurchaseOrderStatusValues = {
  PENDING_APPROVAL: 'PENDING_APPROVAL' as const,
  APPROVED: 'APPROVED' as const,
  REJECTED: 'REJECTED' as const,
  DRAFT: 'DRAFT' as const,
  SENT: 'SENT' as const,
  CONFIRMED: 'CONFIRMED' as const,
  DELIVERY_COMPLETED: 'DELIVERY_COMPLETED' as const,
  CANCELLED: 'CANCELLED' as const,
};
export type PurchaseOrderStatus = (typeof purchaseOrderStatusEnum.enumValues)[number];

export const purchaseOrderReceiptStatusEnum = commerceSchema.enum('purchase_order_receipt_status', [
  'NOT_RECEIVED',
  'PARTIAL',
  'RECEIVED',
]);
export type PurchaseOrderReceiptStatus = (typeof purchaseOrderReceiptStatusEnum.enumValues)[number];
export const PurchaseOrderReceiptStatusValues = {
  NOT_RECEIVED: 'NOT_RECEIVED',
  PARTIAL: 'PARTIAL',
  RECEIVED: 'RECEIVED',
} as const satisfies Record<PurchaseOrderReceiptStatus, PurchaseOrderReceiptStatus>;

export const purchaseOrderInvoiceStatusEnum = commerceSchema.enum('purchase_order_invoice_status', [
  'NOTHING_TO_INVOICE',
  'TO_INVOICE',
  'PARTIAL',
  'INVOICED',
]);
export type PurchaseOrderInvoiceStatus = (typeof purchaseOrderInvoiceStatusEnum.enumValues)[number];
export const PurchaseOrderInvoiceStatusValues = {
  NOTHING_TO_INVOICE: 'NOTHING_TO_INVOICE',
  TO_INVOICE: 'TO_INVOICE',
  PARTIAL: 'PARTIAL',
  INVOICED: 'INVOICED',
} as const satisfies Record<PurchaseOrderInvoiceStatus, PurchaseOrderInvoiceStatus>;

export const goodsReceiptStatusEnum = commerceSchema.enum('goods_receipt_status', ['DRAFT', 'POSTED']);
export const GoodsReceiptStatusValues = {
  DRAFT: 'DRAFT' as const,
  POSTED: 'POSTED' as const,
};
export type GoodsReceiptStatus = (typeof goodsReceiptStatusEnum.enumValues)[number];

export const inboundDeliveryStatusEnum = commerceSchema.enum('inbound_delivery_status', [
  'PLANNED',
  'IN_TRANSIT',
  'ARRIVED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
]);
export const InboundDeliveryStatusValues = {
  PLANNED: 'PLANNED' as const,
  IN_TRANSIT: 'IN_TRANSIT' as const,
  ARRIVED: 'ARRIVED' as const,
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED' as const,
  RECEIVED: 'RECEIVED' as const,
  CANCELLED: 'CANCELLED' as const,
};
export type InboundDeliveryStatus = (typeof inboundDeliveryStatusEnum.enumValues)[number];

export const inboundDeliverySourceEnum = commerceSchema.enum('inbound_delivery_source', [
  'ANNOUNCED',
  'GOODS_RECEIPT',
  'SUPPLIER_INVOICE',
]);
export const InboundDeliverySourceValues = {
  ANNOUNCED: 'ANNOUNCED' as const,
  GOODS_RECEIPT: 'GOODS_RECEIPT' as const,
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE' as const,
};
export type InboundDeliverySource = (typeof inboundDeliverySourceEnum.enumValues)[number];

export const supplierInvoiceStatusEnum = commerceSchema.enum('supplier_invoice_status', [
  'DRAFT',
  'POSTED',
  'CANCELLED',
]);
export const SupplierInvoiceStatusValues = {
  DRAFT: 'DRAFT' as const,
  POSTED: 'POSTED' as const,
  CANCELLED: 'CANCELLED' as const,
};
export type SupplierInvoiceStatus = (typeof supplierInvoiceStatusEnum.enumValues)[number];

export const supplierInvoiceSourceEnum = commerceSchema.enum('supplier_invoice_source', ['ENTERED', 'SELF_INVOICED']);
export type SupplierInvoiceSource = (typeof supplierInvoiceSourceEnum.enumValues)[number];
export const SupplierInvoiceSourceValues = {
  ENTERED: 'ENTERED',
  SELF_INVOICED: 'SELF_INVOICED',
} as const satisfies Record<SupplierInvoiceSource, SupplierInvoiceSource>;

export const supplierInvoicePaymentStatusEnum = commerceSchema.enum('supplier_invoice_payment_status', [
  'UNPAID',
  'PARTIAL',
  'PAID',
]);
export type SupplierInvoicePaymentStatus = (typeof supplierInvoicePaymentStatusEnum.enumValues)[number];
export const SupplierInvoicePaymentStatusValues = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const satisfies Record<SupplierInvoicePaymentStatus, SupplierInvoicePaymentStatus>;

export const supplierInvoiceLineTypeEnum = commerceSchema.enum('supplier_invoice_line_type', ['ITEM', 'CHARGE']);
export type SupplierInvoiceLineType = (typeof supplierInvoiceLineTypeEnum.enumValues)[number];
export const SupplierInvoiceLineTypeValues = {
  ITEM: 'ITEM',
  CHARGE: 'CHARGE',
} as const satisfies Record<SupplierInvoiceLineType, SupplierInvoiceLineType>;

export const supplierInvoiceHoldCodeEnum = commerceSchema.enum('supplier_invoice_hold_code', [
  'PRICE_DIFFERS',
  'QTY_NOT_RECEIVED',
  'INVOICED_MORE_THAN_ORDERED',
  'FREE_SHORT',
  'RATE_DIFFERS',
  'QTY_NOT_RELEASED',
  'SHORT_EXPIRY',
]);
export type SupplierInvoiceHoldCode = (typeof supplierInvoiceHoldCodeEnum.enumValues)[number];
export const SupplierInvoiceHoldCodeValues = {
  PRICE_DIFFERS: 'PRICE_DIFFERS',
  QTY_NOT_RECEIVED: 'QTY_NOT_RECEIVED',
  INVOICED_MORE_THAN_ORDERED: 'INVOICED_MORE_THAN_ORDERED',
  FREE_SHORT: 'FREE_SHORT',
  RATE_DIFFERS: 'RATE_DIFFERS',
  QTY_NOT_RELEASED: 'QTY_NOT_RELEASED',
  SHORT_EXPIRY: 'SHORT_EXPIRY',
} as const satisfies Record<SupplierInvoiceHoldCode, SupplierInvoiceHoldCode>;

export const supplierInvoiceHoldStatusEnum = commerceSchema.enum('supplier_invoice_hold_status', [
  'OPEN',
  'RELEASED',
  'RESOLVED',
]);
export type SupplierInvoiceHoldStatus = (typeof supplierInvoiceHoldStatusEnum.enumValues)[number];
export const SupplierInvoiceHoldStatusValues = {
  OPEN: 'OPEN',
  RELEASED: 'RELEASED',
  RESOLVED: 'RESOLVED',
} as const satisfies Record<SupplierInvoiceHoldStatus, SupplierInvoiceHoldStatus>;

export const purchaseTypeEnum = commerceSchema.enum('purchase_type', [
  'DIRECT_PURCHASE',
  'DIRECT_RECEIPT',
  'ORDER_INVOICE_WITH_GOODS',
  'STANDARD',
  'ANNOUNCED',
  'PREPAID',
  'SELF_INVOICING',
]);
export type PurchaseType = (typeof purchaseTypeEnum.enumValues)[number];
export const PurchaseTypeValues = {
  DIRECT_PURCHASE: 'DIRECT_PURCHASE',
  DIRECT_RECEIPT: 'DIRECT_RECEIPT',
  ORDER_INVOICE_WITH_GOODS: 'ORDER_INVOICE_WITH_GOODS',
  STANDARD: 'STANDARD',
  ANNOUNCED: 'ANNOUNCED',
  PREPAID: 'PREPAID',
  SELF_INVOICING: 'SELF_INVOICING',
} as const satisfies Record<PurchaseType, PurchaseType>;

export const purchaseStatusEnum = commerceSchema.enum('purchase_status', ['OPEN', 'COMPLETED', 'CANCELLED']);
export type PurchaseStatus = (typeof purchaseStatusEnum.enumValues)[number];
export const PurchaseStatusValues = {
  OPEN: 'OPEN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const satisfies Record<PurchaseStatus, PurchaseStatus>;

export const purchaseLegStepEnum = commerceSchema.enum('purchase_leg_step', [
  'SOURCING',
  'APPROVAL',
  'PURCHASE_ORDER',
  'INBOUND_DELIVERY',
  'GOODS_RECEIPT',
  'RECEIVE_WITH_INVOICE',
  'SUPPLIER_INVOICE',
  'APPROVE_INVOICE',
  'CLOSED',
]);
export type PurchaseLegStep = (typeof purchaseLegStepEnum.enumValues)[number];
export const PurchaseLegStepValues = {
  SOURCING: 'SOURCING',
  APPROVAL: 'APPROVAL',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  INBOUND_DELIVERY: 'INBOUND_DELIVERY',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  RECEIVE_WITH_INVOICE: 'RECEIVE_WITH_INVOICE',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
  APPROVE_INVOICE: 'APPROVE_INVOICE',
  CLOSED: 'CLOSED',
} as const satisfies Record<PurchaseLegStep, PurchaseLegStep>;

export const purchaseLegStatusEnum = commerceSchema.enum('purchase_leg_status', ['OPEN', 'CLOSED', 'CANCELLED']);
export type PurchaseLegStatus = (typeof purchaseLegStatusEnum.enumValues)[number];
export const PurchaseLegStatusValues = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const satisfies Record<PurchaseLegStatus, PurchaseLegStatus>;

export const purchaseItemSourceEnum = commerceSchema.enum('purchase_item_source', ['MANUAL']);
export type PurchaseItemSource = (typeof purchaseItemSourceEnum.enumValues)[number];
export const PurchaseItemSourceValues = {
  MANUAL: 'MANUAL',
} as const satisfies Record<PurchaseItemSource, PurchaseItemSource>;

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
  'GOODS_RECEIPT',
  'STOCK_ADJUSTMENT',
  'STOCK_TRANSFER',
  'MANUAL_ADJUSTMENT',
  'SUPPLIER_INVOICE',
]);
export type CostSourceType = (typeof costSourceTypeEnum.enumValues)[number];
export const CostSourceTypeValues = {
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  STOCK_TRANSFER: 'STOCK_TRANSFER',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
} as const satisfies Record<CostSourceType, CostSourceType>;

export const costDistributionMethodEnum = commerceSchema.enum('cost_distribution_method', [
  'BY_VALUE',
  'BY_QUANTITY',
  'EQUAL',
]);
export type CostDistributionMethod = (typeof costDistributionMethodEnum.enumValues)[number];
export const CostDistributionMethodValues = {
  BY_VALUE: 'BY_VALUE',
  BY_QUANTITY: 'BY_QUANTITY',
  EQUAL: 'EQUAL',
} as const satisfies Record<CostDistributionMethod, CostDistributionMethod>;

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
  'TIN',
  'EIN',
  'UTR',
  'ABN',
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
  TIN: 'TIN' as const,
  EIN: 'EIN' as const,
  UTR: 'UTR' as const,
  ABN: 'ABN' as const,
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
  'TIN',
  'UTR',
];
export const OrganizationIdentifierTypes: PartyIdentifierType[] = [
  'PAN',
  'CIN',
  'LEI',
  'DUNS',
  'TIN',
  'EIN',
  'UTR',
  'ABN',
];
// Identifier types that are a party's tax identification number in some country
export const TaxIdIdentifierTypes: PartyIdentifierType[] = ['PAN', 'TIN', 'EIN', 'UTR', 'ABN'];

export function isIdentifierTypeApplicable(partyType: PartyType, idType: PartyIdentifierType): boolean {
  const applicable = partyType === 'PERSON' ? PersonIdentifierTypes : OrganizationIdentifierTypes;
  return applicable.includes(idType);
}

export const taxRegistrationTypeEnum = commerceSchema.enum('tax_registration_type', ['GSTIN', 'VAT', 'TIN', 'OTHER']);
export const TaxRegistrationTypeValues = {
  GSTIN: 'GSTIN' as const,
  VAT: 'VAT' as const,
  TIN: 'TIN' as const,
  OTHER: 'OTHER' as const,
};
export type TaxRegistrationType = (typeof taxRegistrationTypeEnum.enumValues)[number];

export const taxRegistrationSchemeEnum = commerceSchema.enum('tax_registration_scheme', [
  'REGULAR',
  'COMPOSITION',
  'SEZ',
]);
export type TaxRegistrationScheme = (typeof taxRegistrationSchemeEnum.enumValues)[number];
export const TaxRegistrationSchemeValues = {
  REGULAR: 'REGULAR',
  COMPOSITION: 'COMPOSITION',
  SEZ: 'SEZ',
} as const satisfies Record<TaxRegistrationScheme, TaxRegistrationScheme>;

export const taxTreatmentEnum = commerceSchema.enum('tax_treatment', [
  'TAXABLE',
  'ZERO_RATED',
  'EXEMPT',
  'OUT_OF_SCOPE',
]);
export type TaxTreatment = (typeof taxTreatmentEnum.enumValues)[number];
export const TaxTreatmentValues = {
  TAXABLE: 'TAXABLE',
  ZERO_RATED: 'ZERO_RATED',
  EXEMPT: 'EXEMPT',
  OUT_OF_SCOPE: 'OUT_OF_SCOPE',
} as const satisfies Record<TaxTreatment, TaxTreatment>;

export const taxJurisdictionCheckEnum = commerceSchema.enum('tax_jurisdiction_check', ['SAME', 'DIFFERENT']);
export type TaxJurisdictionCheck = (typeof taxJurisdictionCheckEnum.enumValues)[number];
export const TaxJurisdictionCheckValues = {
  SAME: 'SAME',
  DIFFERENT: 'DIFFERENT',
} as const satisfies Record<TaxJurisdictionCheck, TaxJurisdictionCheck>;

export const taxCalculationEnum = commerceSchema.enum('tax_calculation', ['PERCENT', 'AMOUNT_PER_MEASURE']);
export type TaxCalculation = (typeof taxCalculationEnum.enumValues)[number];
export const TaxCalculationValues = {
  PERCENT: 'PERCENT',
  AMOUNT_PER_MEASURE: 'AMOUNT_PER_MEASURE',
} as const satisfies Record<TaxCalculation, TaxCalculation>;

export const taxMeasureEnum = commerceSchema.enum('tax_measure', ['UNIT', 'LITRE', 'PURE_ALCOHOL_LITRE', 'KG']);
export type TaxMeasure = (typeof taxMeasureEnum.enumValues)[number];
export const TaxMeasureValues = {
  UNIT: 'UNIT',
  LITRE: 'LITRE',
  PURE_ALCOHOL_LITRE: 'PURE_ALCOHOL_LITRE',
  KG: 'KG',
} as const satisfies Record<TaxMeasure, TaxMeasure>;

export const taxBaseEnum = commerceSchema.enum('tax_base', ['PRICE', 'PRICE_PLUS_PREVIOUS', 'MRP']);
export type TaxBase = (typeof taxBaseEnum.enumValues)[number];
export const TaxBaseValues = {
  PRICE: 'PRICE',
  PRICE_PLUS_PREVIOUS: 'PRICE_PLUS_PREVIOUS',
  MRP: 'MRP',
} as const satisfies Record<TaxBase, TaxBase>;

export const taxJurisdictionLevelEnum = commerceSchema.enum('tax_jurisdiction_level', [
  'STATE',
  'COUNTY',
  'CITY',
  'DISTRICT',
]);
export const TaxJurisdictionLevelValues = {
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

export const supplierPriceSourceEnum = commerceSchema.enum('supplier_price_source', [
  'QUOTATION',
  'MANUAL',
  'PURCHASE_ORDER',
]);
export const SupplierPriceSourceValues = {
  QUOTATION: 'QUOTATION' as const,
  MANUAL: 'MANUAL' as const,
  PURCHASE_ORDER: 'PURCHASE_ORDER' as const,
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

export const CatalogFilterModeValues = {
  STATIC: 'STATIC' as const,
  NARROWING: 'NARROWING' as const,
};

export const paymentTermBaselineEnum = commerceSchema.enum('payment_term_baseline', [
  'INVOICE_DATE',
  'GOODS_RECEIPT_DATE',
  'END_OF_MONTH',
]);
export const PaymentTermBaselineValues = {
  INVOICE_DATE: 'INVOICE_DATE' as const,
  GOODS_RECEIPT_DATE: 'GOODS_RECEIPT_DATE' as const,
  END_OF_MONTH: 'END_OF_MONTH' as const,
};
export type PaymentTermBaseline = (typeof paymentTermBaselineEnum.enumValues)[number];

export const siteItemStatusEnum = commerceSchema.enum('site_item_status', ['ACTIVE', 'BLOCKED']);
export type SiteItemStatus = (typeof siteItemStatusEnum.enumValues)[number];
export const SiteItemStatusValues = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
} as const satisfies Record<SiteItemStatus, SiteItemStatus>;

export const replenishmentMethodEnum = commerceSchema.enum('replenishment_method', ['MANUAL', 'REORDER_POINT']);
export type ReplenishmentMethod = (typeof replenishmentMethodEnum.enumValues)[number];
export const ReplenishmentMethodValues = {
  MANUAL: 'MANUAL',
  REORDER_POINT: 'REORDER_POINT',
} as const satisfies Record<ReplenishmentMethod, ReplenishmentMethod>;
