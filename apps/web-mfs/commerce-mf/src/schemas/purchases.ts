import type { BadgeProps } from '@vritti/quantum-ui/Badge';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { DisplayQuantity } from '@vritti/quantum-ui/format';
import { PRIMARY_UNIT_PLACEHOLDER } from '@vritti/quantum-ui/QuantityField';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { GoodsReceiptStatus } from './goods-receipts';
import {
  type InboundDeliverySource,
  type InboundDeliveryStatus,
  noteDatedByExpectedDay,
  noteDateRefinement,
} from './inbound-deliveries';
import type { SiteStockData } from './inventory-items';
import {
  enforceSchemeRatio,
  type PurchaseOrderInvoiceStatus,
  type PurchaseOrderReceiptStatus,
  type PurchaseOrderStatus,
  poSchemeShape,
} from './purchase-orders';
import type { SiteItemStatus } from './site-items';
import type { SupplierInvoiceStatus } from './supplier-invoices';

export const PurchaseSummaryValues = {
  NOT_STARTED: 'NOT_STARTED',
  SOURCING: 'SOURCING',
  ORDERED: 'ORDERED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
} as const;
export type PurchaseSummary = (typeof PurchaseSummaryValues)[keyof typeof PurchaseSummaryValues];

export const PurchaseItemBucketValues = {
  NOT_ALLOCATED: 'NOT_ALLOCATED',
  NEEDS_QUOTATIONS: 'NEEDS_QUOTATIONS',
  ALLOCATED: 'ALLOCATED',
  ORDERED: 'ORDERED',
  IN_TRANSIT: 'IN_TRANSIT',
  RECEIVED: 'RECEIVED',
  INVOICED: 'INVOICED',
} as const;
export type PurchaseItemBucket = (typeof PurchaseItemBucketValues)[keyof typeof PurchaseItemBucketValues];

export const CancelledQuantityValues = {
  RETURN: 'RETURN',
  DROP: 'DROP',
} as const;
export type CancelledQuantity = (typeof CancelledQuantityValues)[keyof typeof CancelledQuantityValues];

export const PurchaseStatusValues = {
  OPEN: 'OPEN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseStatus = (typeof PurchaseStatusValues)[keyof typeof PurchaseStatusValues];

export const PurchaseTypeValues = {
  DIRECT_PURCHASE: 'DIRECT_PURCHASE',
  DIRECT_RECEIPT: 'DIRECT_RECEIPT',
  ORDER_INVOICE_WITH_GOODS: 'ORDER_INVOICE_WITH_GOODS',
  STANDARD: 'STANDARD',
  ANNOUNCED: 'ANNOUNCED',
  PREPAID: 'PREPAID',
  SELF_INVOICING: 'SELF_INVOICING',
} as const;
export type PurchaseType = (typeof PurchaseTypeValues)[keyof typeof PurchaseTypeValues];

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
} as const;
export type PurchaseLegStep = (typeof PurchaseLegStepValues)[keyof typeof PurchaseLegStepValues];

export const PurchaseLegStatusValues = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseLegStatus = (typeof PurchaseLegStatusValues)[keyof typeof PurchaseLegStatusValues];

export const PurchaseItemSourceValues = {
  MANUAL: 'MANUAL',
} as const;
export type PurchaseItemSource = (typeof PurchaseItemSourceValues)[keyof typeof PurchaseItemSourceValues];

export const PurchaseActionValues = {
  CHANGE_NOTES: 'CHANGE_NOTES',
  ENABLE_QUOTATIONS: 'ENABLE_QUOTATIONS',
  DISABLE_QUOTATIONS: 'DISABLE_QUOTATIONS',
  CHANGE_MIN_QUOTATIONS: 'CHANGE_MIN_QUOTATIONS',
  EDIT_ITEMS: 'EDIT_ITEMS',
  REQUEST_QUOTATION: 'REQUEST_QUOTATION',
  EDIT_ALLOCATIONS: 'EDIT_ALLOCATIONS',
  SUBMIT: 'SUBMIT',
  CLOSE: 'CLOSE',
  CANCEL: 'CANCEL',
  DELETE: 'DELETE',
} as const;
export type PurchaseAction = (typeof PurchaseActionValues)[keyof typeof PurchaseActionValues];

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

export const PurchaseFlowStepStateValues = {
  DONE: 'DONE',
  CURRENT: 'CURRENT',
  UPCOMING: 'UPCOMING',
} as const;
export type PurchaseFlowStepState = (typeof PurchaseFlowStepStateValues)[keyof typeof PurchaseFlowStepStateValues];

type BadgeVariant = BadgeProps['variant'];

export const purchaseSummaryConfig: Record<PurchaseSummary, { label: string; variant: BadgeVariant }> = {
  NOT_STARTED: { label: 'Not started', variant: 'outline' },
  SOURCING: { label: 'Sourcing', variant: 'secondary' },
  ORDERED: { label: 'Ordered', variant: 'info' },
  PARTIALLY_RECEIVED: { label: 'Partially received', variant: 'info' },
  RECEIVED: { label: 'Received', variant: 'success' },
};

export const purchaseItemBucketConfig: Record<PurchaseItemBucket, { label: string }> = {
  NOT_ALLOCATED: { label: 'Not allocated' },
  NEEDS_QUOTATIONS: { label: 'Needs quotations' },
  ALLOCATED: { label: 'Allocated, not ordered' },
  ORDERED: { label: 'Ordered' },
  IN_TRANSIT: { label: 'In transit' },
  RECEIVED: { label: 'Received, not invoiced' },
  INVOICED: { label: 'Fully invoiced' },
};

export const purchaseStatusConfig: Record<PurchaseStatus, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: 'Open', variant: 'outline' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const purchaseLegStepConfig: Record<PurchaseLegStep, { label: string }> = {
  SOURCING: { label: 'Sourcing' },
  APPROVAL: { label: 'Approval' },
  PURCHASE_ORDER: { label: 'Purchase Order' },
  INBOUND_DELIVERY: { label: 'Inbound Delivery' },
  GOODS_RECEIPT: { label: 'Goods Receipt' },
  RECEIVE_WITH_INVOICE: { label: 'Receive with Invoice' },
  SUPPLIER_INVOICE: { label: 'Supplier Invoice' },
  APPROVE_INVOICE: { label: 'Approve Invoice' },
  CLOSED: { label: 'Closed' },
};

export const purchaseTypeConfig: Record<
  PurchaseType,
  { label: string; description: string; steps: PurchaseLegStep[] }
> = {
  DIRECT_PURCHASE: {
    label: 'Direct Purchase',
    description: 'The supplier invoice arrives with the goods; the purchase order is created behind it.',
    steps: [PurchaseLegStepValues.RECEIVE_WITH_INVOICE],
  },
  DIRECT_RECEIPT: {
    label: 'Receive, Invoice Later',
    description: 'Goods arrive on a delivery challan and the supplier invoice follows later.',
    steps: [PurchaseLegStepValues.GOODS_RECEIPT, PurchaseLegStepValues.SUPPLIER_INVOICE],
  },
  ORDER_INVOICE_WITH_GOODS: {
    label: 'Order, Invoice with Goods',
    description: "You order; the supplier's invoice comes with the goods.",
    steps: [PurchaseLegStepValues.PURCHASE_ORDER, PurchaseLegStepValues.RECEIVE_WITH_INVOICE],
  },
  STANDARD: {
    label: 'Order, Receive, Invoice',
    description: 'Standard three-way match.',
    steps: [
      PurchaseLegStepValues.PURCHASE_ORDER,
      PurchaseLegStepValues.GOODS_RECEIPT,
      PurchaseLegStepValues.SUPPLIER_INVOICE,
    ],
  },
  ANNOUNCED: {
    label: 'Order with Inbound Delivery',
    description: 'Each shipment is recorded as an inbound delivery before it arrives.',
    steps: [
      PurchaseLegStepValues.PURCHASE_ORDER,
      PurchaseLegStepValues.INBOUND_DELIVERY,
      PurchaseLegStepValues.GOODS_RECEIPT,
      PurchaseLegStepValues.SUPPLIER_INVOICE,
    ],
  },
  PREPAID: {
    label: 'Order, Invoice, Receive',
    description: 'Prepaid or imports — the supplier invoice comes before the goods.',
    steps: [
      PurchaseLegStepValues.PURCHASE_ORDER,
      PurchaseLegStepValues.SUPPLIER_INVOICE,
      PurchaseLegStepValues.GOODS_RECEIPT,
    ],
  },
  SELF_INVOICING: {
    label: 'Order, Receive, Self-Invoice',
    description: 'The invoice is drafted from the receipt at purchase order prices.',
    steps: [
      PurchaseLegStepValues.PURCHASE_ORDER,
      PurchaseLegStepValues.GOODS_RECEIPT,
      PurchaseLegStepValues.APPROVE_INVOICE,
    ],
  },
};

export const purchaseItemSourceConfig: Record<PurchaseItemSource, { label: string }> = {
  MANUAL: { label: 'Manual' },
};

export interface PurchaseProgressSegments {
  invoiced: number;
  received: number;
  inTransit: number;
  ordered: number;
  allocated: number;
  unallocated: number;
}

export interface PurchaseProgress {
  itemCount: number;
  segments: PurchaseProgressSegments;
}

export interface PurchaseBlockers {
  enableQuotations: string | null;
  submit: string | null;
  close: string | null;
  cancel: string | null;
  delete: string | null;
}

export interface PurchaseTableRow {
  id: string;
  purchaseNumber: string;
  status: PurchaseStatus;
  summary: PurchaseSummary | null;
  siteId: string;
  siteName: string;
  siteCode: string;
  itemCount: number;
  progress: PurchaseProgress;
  createdAt: string;
}

export type PurchasesTableResponse = TableResponse<PurchaseTableRow>;

export interface PurchaseData {
  id: string;
  purchaseNumber: string;
  status: PurchaseStatus;
  siteId: string;
  legalEntityId: string;
  quotationsRequired: boolean;
  minQuotations: number;
  notes: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemCode: string;
  primaryUomSymbol: string;
  primaryQty: number;
  allocatedPrimaryQty: number;
  source: PurchaseItemSource;
  sourceId: string | null;
  neededBy: string | null;
  notes: string | null;
}

export interface PurchaseAllocation {
  id: string;
  purchaseItemId: string;
  purchaseSupplierId: string;
  inventoryItemName: string;
  supplierQuotationItemId: string | null;
  quotationNumber: string | null;
  uomId: string;
  uomSymbol: string;
  uomQty: number;
  primaryUomQty: number;
  unitPrice: CurrencyValue;
  isPriced: boolean;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  freePrimaryQty: number;
  purchaseOrderId: string | null;
  purchaseOrderItemId: string | null;
  openForInboundDeliveryQty: number;
}

export interface PurchaseSourcingAllocation extends PurchaseAllocation {
  supplierId: string;
  supplierName: string;
  legStep: PurchaseLegStep;
  legStatus: PurchaseLegStatus;
  isEditable: boolean;
}

export interface PurchaseItemSupplierProgress {
  legId: string;
  supplierId: string;
  supplierName: string;
  allocated: number;
  ordered: number;
  inTransit: number;
  received: number;
  invoiced: number;
  display: Record<'allocated' | 'ordered' | 'inTransit' | 'received' | 'invoiced', DisplayQuantity | null>;
}

export type PurchaseItemProgressDisplay = Record<
  | 'primaryQty'
  | 'allocatedPrimaryQty'
  | 'orderedPrimaryQty'
  | 'inTransitPrimaryQty'
  | 'receivedPrimaryQty'
  | 'invoicedPrimaryQty',
  DisplayQuantity | null
>;

export interface PurchaseItemTableRow {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemCode: string;
  categoryName: string;
  primaryUomSymbol: string;
  primaryQty: number;
  allocatedPrimaryQty: number;
  orderedPrimaryQty: number;
  inTransitPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
  quotingSupplierCount: number;
  suppliers: PurchaseItemSupplierProgress[];
  problems: PurchaseItemProblem[];
  supplierItemsRequired: boolean;
  neededBy: string | null;
  notes: string | null;
  display: PurchaseItemProgressDisplay;
}

// What needs a buyer's attention on a purchase item before it can be bought
export const PurchaseItemProblemCodeValues = {
  PURCHASING_BLOCKED: 'PURCHASING_BLOCKED',
} as const;
export type PurchaseItemProblemCode =
  (typeof PurchaseItemProblemCodeValues)[keyof typeof PurchaseItemProblemCodeValues];

export interface PurchaseItemProblem {
  code: PurchaseItemProblemCode;
  detail: string;
}

export type PurchaseItemsTableResponse = TableResponse<PurchaseItemTableRow>;

export type PurchaseItemFacets = Record<PurchaseItemBucket | 'ALL', number>;

export interface PurchaseLegRejection {
  reason: string;
  actorId: string | null;
  actorName: string | null;
  at: string;
}

export interface PurchaseLegPurchaseOrder {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  receiptStatus: PurchaseOrderReceiptStatus;
  invoiceStatus: PurchaseOrderInvoiceStatus;
  currencyCode: string;
}

export interface PurchaseLegDelivery {
  id: string;
  deliveryNumber: string;
  status: InboundDeliveryStatus;
  source: InboundDeliverySource;
  expectedDeliveryDate: string;
  receiptDraftId: string | null;
}

export interface PurchaseLegReceipt {
  id: string;
  grNumber: string;
  status: GoodsReceiptStatus;
  receivedDate: string;
}

export interface PurchaseLegInvoice {
  id: string;
  invoiceNumber: string;
  status: SupplierInvoiceStatus;
  openHoldCount: number;
  isReceiveWithInvoice: boolean;
}

export interface PurchaseLegDocuments {
  purchaseOrders: PurchaseLegPurchaseOrder[];
  deliveries: PurchaseLegDelivery[];
  receipts: PurchaseLegReceipt[];
  invoices: PurchaseLegInvoice[];
}

export interface PurchaseLegProgress {
  duePrimaryQty: number;
  orderedPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
}

export interface PurchaseRef {
  id: string;
  purchaseNumber: string;
}

export interface PurchaseLeg {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierEnrollmentId: string;
  type: PurchaseType;
  approvalEnabled: boolean;
  approvalThreshold: CurrencyValue;
  qualityCheckEnabled: boolean;
  step: PurchaseLegStep;
  status: PurchaseLegStatus;
  approverUserIds: string[];
  approverNames: string[];
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  submittedAt: string | null;
  sourcedTotal: CurrencyValue;
  hasUnpricedAllocations: boolean;
  rejection: PurchaseLegRejection | null;
  closeReason: string | null;
  receivingClosedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  lineCount: number;
  allocations: PurchaseAllocation[];
  documents: PurchaseLegDocuments;
  progress: PurchaseLegProgress;
  availableActions: PurchaseLegAction[];
  blockers: { cancel: string | null; close: string | null; order: string | null };
}

export type PurchaseLegsTableResponse = TableResponse<PurchaseLeg>;

export interface PurchaseLegCount {
  step: PurchaseLegStep;
  status: PurchaseLegStatus;
  count: number;
  lineCount: number;
}

export interface PurchaseSupplierDocuments {
  legId: string;
  supplierId: string;
  supplierName: string;
  documents: PurchaseLegDocuments;
}

export interface PurchaseQuotationItem {
  id: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string;
  unitPrice: CurrencyValue;
  unitPricePerPrimary: CurrencyValue;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
}

export interface PurchaseQuotation {
  id: string;
  // The site that requested it, or the legal entity, owns it
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: 'ORG' | 'LE' | 'SITE';
  ownerName: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
  pricedItemCount: number;
  itemCount: number;
}

export type PurchaseQuotationsTableResponse = TableResponse<PurchaseQuotation>;

export interface PurchaseItemQuote {
  quotationId: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  line: PurchaseQuotationItem;
}

export interface PurchaseItemView extends PurchaseItem {
  categoryName: string;
  taxClassName: string;
  primaryUomAllowDecimal: boolean;
  problems: PurchaseItemProblem[];
  supplierItemsRequired: boolean;
  display: Record<'primaryQty' | 'allocatedPrimaryQty', DisplayQuantity | null>;
}

export interface PurchaseItemCounts {
  allocationCount: number;
  quoteCount: number;
  documentCount: number;
}

export interface PurchaseItemProgressSummary {
  primaryQty: number;
  allocatedPrimaryQty: number;
  orderedPrimaryQty: number;
  inTransitPrimaryQty: number;
  receivedPrimaryQty: number;
  invoicedPrimaryQty: number;
  suppliers: PurchaseItemSupplierProgress[];
  display: PurchaseItemProgressDisplay;
}

export interface PurchaseItemAllocationRow extends PurchaseSourcingAllocation {
  poNumber: string | null;
  poStatus: PurchaseOrderStatus | null;
  receivedPrimaryQty: number | null;
  invoicedPrimaryQty: number | null;
  display: Record<'primaryUomQty' | 'receivedPrimaryQty' | 'invoicedPrimaryQty', DisplayQuantity | null>;
}
export type PurchaseItemAllocationsTableResponse = TableResponse<PurchaseItemAllocationRow>;

export interface PurchaseItemQuoteRow extends PurchaseItemQuote {
  isLowest: boolean;
}
export type PurchaseItemQuotesTableResponse = TableResponse<PurchaseItemQuoteRow>;

// The kinds of document that move a purchase item once it is ordered
export const PurchaseItemDocumentTypeValues = {
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  INBOUND_DELIVERY: 'INBOUND_DELIVERY',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
} as const;
export type PurchaseItemDocumentType =
  (typeof PurchaseItemDocumentTypeValues)[keyof typeof PurchaseItemDocumentTypeValues];

export const purchaseItemDocumentTypeConfig: Record<PurchaseItemDocumentType, { label: string }> = {
  [PurchaseItemDocumentTypeValues.PURCHASE_ORDER]: { label: 'Purchase Order' },
  [PurchaseItemDocumentTypeValues.INBOUND_DELIVERY]: { label: 'Inbound Delivery' },
  [PurchaseItemDocumentTypeValues.GOODS_RECEIPT]: { label: 'Goods Receipt' },
  [PurchaseItemDocumentTypeValues.SUPPLIER_INVOICE]: { label: 'Supplier Invoice' },
};

export const purchaseItemDocumentTypeOptions = Object.values(PurchaseItemDocumentTypeValues).map((value) => ({
  value,
  label: purchaseItemDocumentTypeConfig[value].label,
}));

interface PurchaseItemDocumentLine {
  lineId: string;
  documentId: string;
  documentNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  primaryQty: number;
  display: Record<'primaryQty', DisplayQuantity | null>;
}

export type PurchaseItemDocument = PurchaseItemDocumentLine &
  (
    | { type: typeof PurchaseItemDocumentTypeValues.PURCHASE_ORDER; status: PurchaseOrderStatus }
    | { type: typeof PurchaseItemDocumentTypeValues.INBOUND_DELIVERY; status: InboundDeliveryStatus }
    | { type: typeof PurchaseItemDocumentTypeValues.GOODS_RECEIPT; status: GoodsReceiptStatus }
    | { type: typeof PurchaseItemDocumentTypeValues.SUPPLIER_INVOICE; status: SupplierInvoiceStatus }
  );
export type PurchaseItemDocumentsTableResponse = TableResponse<PurchaseItemDocument>;

export interface PurchaseItemSiteStock extends SiteStockData {
  status: SiteItemStatus;
  blockedReason: string | null;
}

export interface PurchaseSettings {
  siteId: string;
  supplierItemsRequired: boolean;
  updateSupplierItemsFromOrders: boolean;
}

export interface PurchaseSettingsRow extends PurchaseSettings {
  siteName: string;
  siteCode: string;
}

export type UpdatePurchaseSettingsPayload = Pick<PurchaseSettings, 'siteId'> &
  Partial<Pick<PurchaseSettings, 'supplierItemsRequired' | 'updateSupplierItemsFromOrders'>>;

export interface PurchaseItemComparison {
  item: PurchaseItemTableRow;
  quotes: PurchaseItemQuote[];
  allocations: PurchaseSourcingAllocation[];
}

export type PurchaseItemComparisonTableResponse = TableResponse<PurchaseItemComparison>;

export interface PurchaseLegFlowStep {
  step: PurchaseLegStep;
  state: PurchaseFlowStepState;
}

export interface PurchaseDetail extends PurchaseData {
  siteName: string;
  siteCode: string;
}

export interface PurchaseCounts {
  itemCount: number;
  supplierCount: number;
  quotationCount: number;
}

export interface PurchaseProgressSummary extends PurchaseProgress {
  summary: PurchaseSummary | null;
}

export interface PurchaseActions {
  availableActions: PurchaseAction[];
  blockers: PurchaseBlockers;
}

export interface CreatePurchasePayload {
  siteId?: string;
  notes?: string;
  quotationsRequired: boolean;
  minQuotations?: number;
}

export interface ChangePurchaseNotesPayload {
  id: string;
  notes: string | null;
}

export interface EnablePurchaseQuotationsPayload {
  id: string;
  minQuotations: number;
}

export interface DisablePurchaseQuotationsPayload {
  id: string;
  reason: string;
}

export interface ChangePurchaseMinQuotationsPayload {
  id: string;
  minQuotations: number;
  reason?: string | null;
}

export interface CancelPurchasePayload {
  id: string;
  reason: string;
}

export interface PurchaseItemRef {
  id: string;
  itemId: string;
}

export interface AddPurchaseItemPayload {
  id: string;
  inventoryItemId: string;
  primaryQty: number;
  neededBy?: string;
  notes?: string;
}

export interface UpdatePurchaseItemPayload extends PurchaseItemRef {
  primaryQty?: number;
  neededBy?: string | null;
  notes?: string | null;
}

export interface RequestPurchaseQuotationPayload {
  id: string;
  supplierId: string;
}

export interface RequestedPurchaseQuotation {
  quotationId: string;
}

export interface PurchaseAllocationRef {
  id: string;
  allocationId: string;
}

export interface AddPurchaseAllocationPayload {
  id: string;
  purchaseItemId: string;
  supplierId: string;
  uomId: string;
  uomQty: number;
  unitPrice?: CurrencyValue;
  schemeBuyQty?: number;
  schemeFreeQty?: number;
}

export interface AddPurchaseAllocationsFromQuotationPayload {
  id: string;
  supplierQuotationId?: string;
  supplierQuotationItemIds?: string[];
}

export interface UpdatePurchaseAllocationPayload extends PurchaseAllocationRef {
  uomId?: string;
  uomQty?: number;
  unitPrice?: CurrencyValue | null;
  schemeBuyQty?: number | null;
  schemeFreeQty?: number | null;
}

export interface PurchaseLegRef {
  id: string;
  legId: string;
}

export interface RejectPurchaseLegPayload extends PurchaseLegRef {
  reason: string;
}

export interface PurchaseLegExchangeRate {
  currencyCode: string;
  rate: number;
}

export interface CreatePurchaseLegPurchaseOrdersPayload extends PurchaseLegRef {
  orderDate: string;
  exchangeRates?: PurchaseLegExchangeRate[];
  expectedDeliveryDate?: string;
}

export interface CreatedPurchaseLegPurchaseOrders {
  purchaseOrderIds: string[];
}

export interface ConfirmPurchaseLegPurchaseOrderPayload extends PurchaseLegRef {
  purchaseOrderId: string;
}

export interface PurchaseLegInboundDeliveryLine {
  purchaseOrderItemId: string;
  quantity: number;
}

export interface CreatePurchaseLegInboundDeliveryPayload extends PurchaseLegRef {
  expectedDeliveryDate: string;
  carrier?: string;
  trackingNumber?: string;
  supplierDeliveryNoteNumber?: string;
  supplierDeliveryNoteDate?: string;
  lines: PurchaseLegInboundDeliveryLine[];
}

export interface CreatedPurchaseLegInboundDelivery {
  inboundDeliveryId: string;
}

export interface CreatePurchaseLegGoodsReceiptPayload extends PurchaseLegRef {
  inboundDeliveryId?: string;
  receivedDate: string;
  supplierDeliveryNoteNumber?: string;
  supplierDeliveryNoteDate?: string;
}

export interface CreatedPurchaseLegGoodsReceipt {
  goodsReceiptId: string;
}

export interface ClosePurchaseLegPayload extends PurchaseLegRef {
  reason?: string;
}

export interface CancelPurchaseLegPayload extends PurchaseLegRef {
  quantity: CancelledQuantity;
  reason: string;
}

export interface ClosePurchasePayload {
  id: string;
  reason?: string;
}

export interface CreatePurchaseSupplierInvoicePayload {
  siteId?: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate?: string;
  currencyCode: string;
  exchangeRate?: number;
  purchaseIds?: string[];
}

export interface CreatedPurchaseSupplierInvoice {
  supplierInvoiceId: string;
}

const purchaseShape = {
  notes: z.string(),
  quotationsRequired: z.boolean(),
  minQuotations: zodNumericField({
    required: 'Enter how many quotations are needed',
    integer: true,
    positive: true,
    nonZero: true,
  }),
};

// A legal entity picks the site it purchases for; a site purchases for itself
export function buildCreatePurchaseSchema({ requiresSite }: { requiresSite: boolean }) {
  return z.object({
    ...purchaseShape,
    siteId: requiresSite ? z.uuid('Site is required') : z.uuid().optional(),
  });
}

export type CreatePurchaseFormData = z.infer<ReturnType<typeof buildCreatePurchaseSchema>>;

export const purchaseNotesSchema = z.object({ notes: purchaseShape.notes });

export type PurchaseNotesFormData = z.infer<typeof purchaseNotesSchema>;

export const purchaseMinQuotationsSchema = z.object({ minQuotations: purchaseShape.minQuotations });

export type PurchaseMinQuotationsFormData = z.infer<typeof purchaseMinQuotationsSchema>;

export const changePurchaseMinQuotationsSchema = z.object({
  minQuotations: purchaseShape.minQuotations,
  reason: z.string().max(1000, 'Reason must be at most 1000 characters'),
});

export type ChangePurchaseMinQuotationsFormData = z.infer<typeof changePurchaseMinQuotationsSchema>;

export const purchaseReasonSchema = z.object({
  reason: z
    .string({ error: 'Reason is required' })
    .trim()
    .min(1, 'Reason is required')
    .max(1000, 'Reason must be at most 1000 characters'),
});

export type PurchaseReasonFormData = z.infer<typeof purchaseReasonSchema>;

const purchaseItemShape = {
  primaryQty: zodNumericField({ required: 'Quantity is required', positive: true, nonZero: true }),
  neededBy: z.string().nullish(),
  notes: z.string(),
};

// The add-item form; an item whose primary unit cannot be split needs a whole number of it, whatever unit it is typed in
export function buildAddPurchaseItemSchema({ allowDecimal }: { allowDecimal: boolean }) {
  return z.object({
    inventoryItemId: z.uuid('Item is required'),
    ...purchaseItemShape,
    primaryQty: zodNumericField({
      required: 'Quantity is required',
      positive: true,
      nonZero: true,
      integer: !allowDecimal,
      integerMessage: `Must come to a whole number of ${PRIMARY_UNIT_PLACEHOLDER}`,
    }),
  });
}

export type AddPurchaseItemFormData = z.infer<ReturnType<typeof buildAddPurchaseItemSchema>>;

export const updatePurchaseItemSchema = z.object(purchaseItemShape);

export type UpdatePurchaseItemFormData = z.infer<typeof updatePurchaseItemSchema>;

export const requestPurchaseQuotationSchema = z.object({
  supplierId: z.uuid('Supplier is required'),
});

export type RequestPurchaseQuotationFormData = z.infer<typeof requestPurchaseQuotationSchema>;

const purchaseAllocationShape = {
  uomId: z.uuid('Unit is required'),
  uomQty: zodNumericField({ required: 'Quantity is required', positive: true, nonZero: true }),
  unitPrice: zodCurrencyField({ optional: true }),
  ...poSchemeShape,
};

export const addPurchaseAllocationSchema = z
  .object({ supplierId: z.uuid('Supplier is required'), ...purchaseAllocationShape })
  .superRefine(enforceSchemeRatio);

export type AddPurchaseAllocationFormData = z.infer<typeof addPurchaseAllocationSchema>;

export const updatePurchaseAllocationSchema = z.object(purchaseAllocationShape).superRefine(enforceSchemeRatio);

export type UpdatePurchaseAllocationFormData = z.infer<typeof updatePurchaseAllocationSchema>;

const requiredDate = (message: string) => z.string({ error: message }).min(1, message);

// Asks for the rate only when the amounts are in another currency than the legal entity's
export function requireForeignRate(
  data: { currencyCode: string; exchangeRate?: number },
  ctx: z.RefinementCtx,
  leCurrencyCode: string,
) {
  if (data.currencyCode === leCurrencyCode || data.exchangeRate != null) return;
  ctx.addIssue({ code: 'custom', path: ['exchangeRate'], message: 'Exchange rate is required' });
}

// One rate per currency the leg's allocations are priced in other than the legal entity's
export const purchaseLegPurchaseOrdersSchema = z.object({
  orderDate: requiredDate('Order date is required'),
  exchangeRates: z.array(
    z.object({
      currencyCode: z.string(),
      rate: zodNumericField({ required: 'Exchange rate is required', positive: true, nonZero: true }),
    }),
  ),
  expectedDeliveryDate: z.string().nullish(),
});

export type PurchaseLegPurchaseOrdersFormData = z.infer<typeof purchaseLegPurchaseOrdersSchema>;

const deliveryNoteShape = {
  supplierDeliveryNoteNumber: z.string().max(100, 'At most 100 characters'),
  supplierDeliveryNoteDate: z.string().nullish(),
};

// `findOpenQty` resolves what is still open for inbound delivery of an order line, so no line delivers more than that
export function buildPurchaseLegInboundDeliverySchema(
  findOpenQty: (purchaseOrderItemId: string) => number | undefined,
) {
  return z
    .object({
      expectedDeliveryDate: requiredDate('Expected delivery date is required'),
      carrier: z.string().max(100, 'At most 100 characters'),
      trackingNumber: z.string().max(100, 'At most 100 characters'),
      ...deliveryNoteShape,
      lines: z
        .array(
          z.object({
            purchaseOrderItemId: z.uuid('Purchase order line is required'),
            quantity: zodNumericField({ required: 'Quantity is required', positive: true, nonZero: true }),
          }),
        )
        .min(1, 'Add at least one line')
        .superRefine((lines, ctx) => {
          lines.forEach((line, index) => {
            const openQty = findOpenQty(line.purchaseOrderItemId);
            if (openQty === undefined || line.quantity <= openQty) return;
            ctx.addIssue({
              code: 'custom',
              path: [index, 'quantity'],
              message: `Cannot exceed what is still open for inbound delivery (${openQty}).`,
            });
          });
        }),
    })
    .refine(noteDatedByExpectedDay, noteDateRefinement);
}

export type PurchaseLegInboundDeliveryFormData = z.infer<ReturnType<typeof buildPurchaseLegInboundDeliverySchema>>;

// An inbound-delivery leg receives only against one of its deliveries; the others may also receive without one
export function buildPurchaseLegGoodsReceiptSchema({ deliveryRequired }: { deliveryRequired: boolean }) {
  return z.object({
    inboundDeliveryId: deliveryRequired ? z.uuid('Delivery is required') : z.uuid().optional(),
    receivedDate: requiredDate('Received date is required'),
    ...deliveryNoteShape,
  });
}

export type PurchaseLegGoodsReceiptFormData = z.infer<ReturnType<typeof buildPurchaseLegGoodsReceiptSchema>>;

export const purchaseCloseReasonSchema = z.object({
  reason: z.string().max(1000, 'Reason must be at most 1000 characters'),
});

export type PurchaseCloseReasonFormData = z.infer<typeof purchaseCloseReasonSchema>;

export const cancelPurchaseLegSchema = z.object({
  quantity: z.enum(Object.values(CancelledQuantityValues) as [CancelledQuantity, ...CancelledQuantity[]]),
  reason: z
    .string({ error: 'Reason is required' })
    .trim()
    .min(1, 'Reason is required')
    .max(1000, 'Reason must be at most 1000 characters'),
});

export type CancelPurchaseLegFormData = z.infer<typeof cancelPurchaseLegSchema>;

// The supplier invoice header of a supplier; the exchange rate is asked only for a currency other than the legal entity's
export function buildPurchaseSupplierInvoiceSchema({ leCurrencyCode }: { leCurrencyCode: string }) {
  return z
    .object({
      supplierId: z.uuid('Supplier is required'),
      invoiceNumber: z
        .string({ error: 'Invoice number is required' })
        .trim()
        .min(1, 'Invoice number is required')
        .max(100, 'Invoice number must be at most 100 characters'),
      invoiceDate: requiredDate('Invoice date is required'),
      taxDate: requiredDate('Tax date is required'),
      currencyCode: z.string({ error: 'Currency is required' }).regex(/^[A-Z]{3}$/, 'Currency is required'),
      exchangeRate: zodNumericField({ positive: true, nonZero: true }).optional(),
    })
    .superRefine((data, ctx) => requireForeignRate(data, ctx, leCurrencyCode));
}

export type PurchaseSupplierInvoiceFormData = z.infer<ReturnType<typeof buildPurchaseSupplierInvoiceSchema>>;
