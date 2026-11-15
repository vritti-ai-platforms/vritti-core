import type { BadgeProps } from '@vritti/quantum-ui/Badge';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { GoodsReceiptStatus } from './goods-receipts';
import {
  type InboundDeliverySource,
  type InboundDeliveryStatus,
  noteDatedByExpectedDay,
  noteDateRefinement,
} from './inbound-deliveries';
import {
  enforceSchemeRatio,
  type PurchaseOrderInvoiceStatus,
  type PurchaseOrderReceiptStatus,
  type PurchaseOrderStatus,
  poSchemeShape,
} from './purchase-orders';
import type { SupplierInvoiceStatus } from './supplier-invoices';

export const PurchaseStepValues = {
  REQUESTING: 'REQUESTING',
  QUOTING: 'QUOTING',
  SOURCING: 'SOURCING',
  PROCURING: 'PROCURING',
} as const;
export type PurchaseStep = (typeof PurchaseStepValues)[keyof typeof PurchaseStepValues];

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
  EDIT: 'EDIT',
  CANCEL: 'CANCEL',
  DELETE: 'DELETE',
  EDIT_ITEMS: 'EDIT_ITEMS',
  SUBMIT_ITEMS: 'SUBMIT_ITEMS',
  REQUEST_QUOTATION: 'REQUEST_QUOTATION',
  COMPLETE_QUOTATIONS: 'COMPLETE_QUOTATIONS',
  EDIT_ALLOCATIONS: 'EDIT_ALLOCATIONS',
  SUBMIT: 'SUBMIT',
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
} as const;
export type PurchaseLegAction = (typeof PurchaseLegActionValues)[keyof typeof PurchaseLegActionValues];

export const PurchaseFlowStepStateValues = {
  DONE: 'DONE',
  CURRENT: 'CURRENT',
  UPCOMING: 'UPCOMING',
} as const;
export type PurchaseFlowStepState = (typeof PurchaseFlowStepStateValues)[keyof typeof PurchaseFlowStepStateValues];

type BadgeVariant = BadgeProps['variant'];

export const purchaseStepConfig: Record<PurchaseStep, { label: string; variant: BadgeVariant }> = {
  REQUESTING: { label: 'Requesting', variant: 'outline' },
  QUOTING: { label: 'Quoting', variant: 'warning' },
  SOURCING: { label: 'Sourcing', variant: 'secondary' },
  PROCURING: { label: 'Procuring', variant: 'default' },
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

export interface PurchaseProgressQuotations {
  posted: number;
  needed: number;
}

export interface PurchaseProgressSegments {
  invoiced: number;
  received: number;
  inTransit: number;
  ordered: number;
  allocated: number;
  unallocated: number;
}

interface PurchaseProgressBase {
  itemCount: number;
  segments: PurchaseProgressSegments;
}

// Quotations are counted only while the purchase is Quoting
export type PurchaseProgress =
  | (PurchaseProgressBase & { stage: typeof PurchaseStepValues.QUOTING; quotations: PurchaseProgressQuotations })
  | (PurchaseProgressBase & {
      stage: Exclude<PurchaseStep, typeof PurchaseStepValues.QUOTING>;
      quotations: null;
    });

export interface PurchaseTableRow {
  id: string;
  purchaseNumber: string;
  step: PurchaseStep;
  status: PurchaseStatus;
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
  step: PurchaseStep;
  status: PurchaseStatus;
  siteId: string;
  legalEntityId: string;
  quotationsRequired: boolean;
  minQuotations: number;
  notes: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemCode: string;
  primaryUomSymbol: string | null;
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
  uomSymbol: string | null;
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

export interface PurchaseSourcingItem extends PurchaseItem {
  allocations: PurchaseSourcingAllocation[];
}

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
  allocations: PurchaseAllocation[];
  documents: PurchaseLegDocuments;
  progress: PurchaseLegProgress;
  availableActions: PurchaseLegAction[];
}

export interface PurchaseQuotationItem {
  id: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
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
  items: PurchaseQuotationItem[];
}

export interface PurchaseLegFlowStep {
  step: PurchaseLegStep;
  state: PurchaseFlowStepState;
}

export interface PurchaseHeader extends PurchaseData {
  siteName: string;
  siteCode: string;
  itemCount: number;
  quotationCount: number;
  supplierCount: number;
  cancelReason: string | null;
  progress: PurchaseProgress;
  availableActions: PurchaseAction[];
}

export interface CreatePurchasePayload {
  siteId?: string;
  notes?: string;
  quotationsRequired: boolean;
  minQuotations?: number;
}

export interface UpdatePurchasePayload {
  id: string;
  notes?: string | null;
  quotationsRequired?: boolean;
  minQuotations?: number;
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
  supplierQuotationItemIds: string[];
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

export const updatePurchaseSchema = z.object(purchaseShape);

export type UpdatePurchaseFormData = z.infer<typeof updatePurchaseSchema>;

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

export const addPurchaseItemSchema = z.object({
  inventoryItemId: z.uuid('Item is required'),
  ...purchaseItemShape,
});

export type AddPurchaseItemFormData = z.infer<typeof addPurchaseItemSchema>;

export const updatePurchaseItemSchema = z.object(purchaseItemShape);

export type UpdatePurchaseItemFormData = z.infer<typeof updatePurchaseItemSchema>;

export const requestPurchaseQuotationSchema = z.object({
  supplierId: z.uuid('Supplier is required'),
});

export type RequestPurchaseQuotationFormData = z.infer<typeof requestPurchaseQuotationSchema>;

export const applyPurchaseQuotationSchema = z.object({
  quotationId: z.uuid('Quotation is required'),
});

export type ApplyPurchaseQuotationFormData = z.infer<typeof applyPurchaseQuotationSchema>;

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

export const closePurchaseLegSchema = z.object({
  reason: z.string().max(1000, 'Reason must be at most 1000 characters'),
});

export type ClosePurchaseLegFormData = z.infer<typeof closePurchaseLegSchema>;

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
