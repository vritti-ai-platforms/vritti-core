import type { BadgeProps } from '@vritti/quantum-ui/Badge';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { DisplayQuantity } from '@vritti/quantum-ui/format';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { GoodsReceiptItemFlagCode, GoodsReceiptStatus } from '@/schemas/goods-receipts';
import type { SupplierInvoiceHoldCode, SupplierInvoiceStatus } from '@/schemas/supplier-invoices';

export const PurchaseOrderStatusValues = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  DELIVERY_COMPLETED: 'DELIVERY_COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseOrderStatus = (typeof PurchaseOrderStatusValues)[keyof typeof PurchaseOrderStatusValues];

export type PurchaseOrderReceiptStatus = 'NOT_RECEIVED' | 'PARTIAL' | 'RECEIVED';

export type PurchaseOrderInvoiceStatus = 'NOTHING_TO_INVOICE' | 'TO_INVOICE' | 'PARTIAL' | 'INVOICED';

export type ManualPurchaseOrderStatus = Extract<PurchaseOrderStatus, 'SENT' | 'CONFIRMED' | 'CANCELLED'>;

export const purchaseOrderStatusConfig: Record<
  PurchaseOrderStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' }
> = {
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'outline' },
  APPROVED: { label: 'Approved', variant: 'secondary' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  DRAFT: { label: 'Draft', variant: 'outline' },
  SENT: { label: 'Sent', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  DELIVERY_COMPLETED: { label: 'Delivery completed', variant: 'secondary' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const purchaseOrderReceiptStatusConfig: Record<
  PurchaseOrderReceiptStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  NOT_RECEIVED: { label: 'Not Received', variant: 'outline' },
  PARTIAL: { label: 'Partially Received', variant: 'warning' },
  RECEIVED: { label: 'Received', variant: 'success' },
};

export const purchaseOrderInvoiceStatusConfig: Record<
  PurchaseOrderInvoiceStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  NOTHING_TO_INVOICE: { label: 'Nothing to Invoice', variant: 'outline' },
  TO_INVOICE: { label: 'To Invoice', variant: 'warning' },
  PARTIAL: { label: 'Partially Invoiced', variant: 'warning' },
  INVOICED: { label: 'Invoiced', variant: 'success' },
};

export const nextPurchaseOrderStatusAction: Partial<
  Record<PurchaseOrderStatus, { label: string; status: ManualPurchaseOrderStatus }>
> = {
  DRAFT: { label: 'Mark as Sent', status: 'SENT' },
  SENT: { label: 'Confirm Purchase Order', status: 'CONFIRMED' },
};

// How many rows each tab of a purchase order's detail page lists
export interface PurchaseOrderCounts {
  itemCount: number;
  inboundDeliveryCount: number;
  goodsReceiptCount: number;
  invoiceCount: number;
}

// What adding a line to a purchase order returns
export interface CreatedPurchaseOrderItem {
  id: string;
}

export interface PurchaseOrderData {
  id: string;
  legalEntityId: string;
  siteId: string;
  siteName?: string;
  siteCode?: string;
  supplierId: string;
  supplierName: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  receiptStatus: PurchaseOrderReceiptStatus;
  invoiceStatus: PurchaseOrderInvoiceStatus;
  paymentTermId: string;
  purchaseId: string | null;
  purchaseNumber: string | null;
  currencyCode: string;
  exchangeRate: number;
  conversionRates: Record<string, string>;
  orderDate: string;
  taxDate: string;
  latestExpectedDeliveryDate: string | null;
  notes: string | null;
  totalAmount: CurrencyValue;
  hasPostedGoodsReceipt: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderDetail = PurchaseOrderData;

export interface PurchaseOrderItemData {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  expectedDeliveryDate: string;
  inboundDeliveryNumbers: string[];
  inboundDeliveryIds: string[];
  inboundDeliveryDates: string[];
  taxDate: string;
  isTaxDateOverridden: boolean;
  isTaxDateLocked: boolean;
  purchasingBlockedReason: string | null;
  uomId: string;
  orderUomSymbol: string;
  uomQty: number;
  expectedFreeQty: number;
  receivedQty: number;
  primaryUomQty: number;
  expectedFreePrimaryQty: number;
  receivedPrimaryQty: number;
  rejectedPrimaryQty: number;
  invoicedPrimaryQty: number;
  returnedPrimaryQty: number;
  cancelledPrimaryQty: number;
  duePrimaryQty: number;
  openToReceivePrimaryQty: number;
  openToInvoicePrimaryQty: number;
  primaryUomSymbol: string;
  currencyCode: string;
  unitPrice: CurrencyValue;
  primaryUomUnitPrice: CurrencyValue;
  totalPrice: CurrencyValue;
  sourceUnitPrice: CurrencyValue | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  display: Record<
    | 'primaryUomQty'
    | 'expectedFreePrimaryQty'
    | 'receivedPrimaryQty'
    | 'rejectedPrimaryQty'
    | 'invoicedPrimaryQty'
    | 'returnedPrimaryQty'
    | 'cancelledPrimaryQty'
    | 'duePrimaryQty'
    | 'openToReceivePrimaryQty'
    | 'openToInvoicePrimaryQty',
    DisplayQuantity | null
  >;
}

export type PurchaseOrdersTableResponse = TableResponse<PurchaseOrderData>;
export type PurchaseOrderItemsTableResponse = TableResponse<PurchaseOrderItemData>;

interface PurchaseOrderProblemBase {
  detail: string;
  blocksPayment: boolean;
  documentId: string;
  documentNumber: string;
  lotNumber: string | null;
}

export const PurchaseOrderProblemSourceValues = {
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
} as const;
export type PurchaseOrderProblemSource =
  (typeof PurchaseOrderProblemSourceValues)[keyof typeof PurchaseOrderProblemSourceValues];

export interface PurchaseOrderReceivingProblem extends PurchaseOrderProblemBase {
  source: typeof PurchaseOrderProblemSourceValues.GOODS_RECEIPT;
  code: GoodsReceiptItemFlagCode;
  holdId: null;
  documentStatus: GoodsReceiptStatus;
}

export interface PurchaseOrderInvoicingProblem extends PurchaseOrderProblemBase {
  source: typeof PurchaseOrderProblemSourceValues.SUPPLIER_INVOICE;
  code: SupplierInvoiceHoldCode;
  holdId: string;
  documentStatus: Exclude<SupplierInvoiceStatus, 'CANCELLED'>;
}

export type PurchaseOrderProblem = PurchaseOrderReceivingProblem | PurchaseOrderInvoicingProblem;

export interface PurchaseOrderLineProblems {
  purchaseOrderItemId: string;
  problems: PurchaseOrderProblem[];
}

export interface PurchaseOrderProblemsResponse {
  summary: { total: number; receiving: number; invoicing: number };
  lines: PurchaseOrderLineProblems[];
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  siteId?: string;
  currencyCode: string;
  exchangeRate: number;
  orderDate: string;
  taxDate: string;
  notes?: string;
}

export interface PurchaseOrderItemRef {
  id: string;
  itemId: string;
}

export interface PurchaseOrderItemDefaults {
  uomId: string | null;
  supplierItemCode: string | null;
  minOrderQuantity: number | null;
  unitPrice: CurrencyValue | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  expectedDeliveryDate: string;
}

export interface AddPurchaseOrderItemPayload {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomQty: number;
  unitPrice: CurrencyValue;
  conversionRate?: number;
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  hasScheme: boolean;
  expectedDeliveryDate?: string;
}

export interface UpdatePurchaseOrderItemPayload extends PurchaseOrderItemRef {
  uomQty?: number;
  unitPrice?: CurrencyValue;
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  hasScheme: boolean;
  expectedDeliveryDate?: string;
  taxDate?: string;
  followPoTaxDate?: boolean;
}

export interface UpdatePurchaseOrderNotesPayload {
  id: string;
  notes?: string | null;
}

export interface UpdatePurchaseOrderTaxDatePayload {
  id: string;
  taxDate: string;
}

export interface ChangePurchaseOrderSupplierPayload {
  id: string;
  supplierId: string;
  exchangeRate?: number;
}

export interface ChangePurchaseOrderExchangeRatePayload {
  id: string;
  exchangeRate: number;
}

export interface SetPurchaseOrderConversionRatePayload {
  id: string;
  currencyCode: string;
  rate: number;
}

export interface UpdatePurchaseOrderStatusPayload {
  id: string;
  status: ManualPurchaseOrderStatus;
}

export interface SendPurchaseOrderEmailPayload {
  id: string;
  email?: string | null;
}

const currencyCodeField = z.string({ error: 'Currency is required' }).regex(/^[A-Z]{3}$/, 'Currency is required');

const expectedDeliveryField = z
  .string({ error: 'Expected delivery is required' })
  .min(1, 'Expected delivery is required');

const taxDateField = z.string({ error: 'Tax date is required' }).min(1, 'Tax date is required');

const expectedDeliveryOnOrAfterOrderDate = {
  check: (data: { orderDate: string; expectedDeliveryDate?: string | null }) =>
    !data.orderDate || !data.expectedDeliveryDate || data.expectedDeliveryDate >= data.orderDate,
  params: { message: 'Expected delivery must be on or after the order date', path: ['expectedDeliveryDate'] },
};

// `requiresSite` adds the site picker of a legal entity raising an order for one of its sites
export function buildCreatePurchaseOrderSchema({ requiresSite }: { requiresSite: boolean }) {
  return z.object({
    supplierId: z.uuid('Supplier is required'),
    siteId: requiresSite ? z.uuid('Site is required') : z.uuid().optional(),
    currencyCode: currencyCodeField,
    exchangeRate: zodNumericField({ required: 'Exchange rate is required', positive: true, nonZero: true }),
    orderDate: z.string({ error: 'Order date is required' }).min(1, 'Order date is required'),
    taxDate: taxDateField,
    notes: z.string(),
  });
}

export type CreatePurchaseOrderFormData = z.infer<ReturnType<typeof buildCreatePurchaseOrderSchema>>;

export const poSchemeShape = {
  schemeBuyQty: zodNumericField({ integer: true, positive: true }).optional(),
  schemeFreeQty: zodNumericField({ integer: true, positive: true }).optional(),
  hasScheme: z.boolean(),
};

// When a scheme is enabled, the buy/free ratio is required
export function enforceSchemeRatio(
  data: { hasScheme: boolean; schemeBuyQty?: number | null; schemeFreeQty?: number | null },
  ctx: z.RefinementCtx,
) {
  if (!data.hasScheme) return;
  if (data.schemeBuyQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeBuyQty'], message: 'Buy qty is required for a scheme.' });
  }
  if (data.schemeFreeQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeFreeQty'], message: 'Free qty is required for a scheme.' });
  }
}

// A line left without a delivery date is expected at the order date plus the item's lead time at the site
export function buildAddPurchaseOrderItemSchema(orderDate: string) {
  return z
    .object({
      inventoryItemId: z.uuid('Item is required'),
      uomId: z.uuid('Unit is required'),
      uomQty: zodNumericField({ required: 'Quantity is required', positive: true }),
      unitPrice: zodCurrencyField({ required: 'Unit price is required.' }),
      rateCurrency: z.string().optional(),
      conversionRate: zodNumericField({ positive: true, nonZero: true }).optional(),
      expectedDeliveryDate: z.string().nullish(),
      ...poSchemeShape,
    })
    .superRefine((data, ctx) => {
      enforceSchemeRatio(data, ctx);
      if (data.rateCurrency && data.conversionRate == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['conversionRate'],
          message: `Enter how much 1 ${data.rateCurrency} is in the PO currency.`,
        });
      }
    })
    .refine(
      (data) => expectedDeliveryOnOrAfterOrderDate.check({ ...data, orderDate }),
      expectedDeliveryOnOrAfterOrderDate.params,
    );
}

export type AddPurchaseOrderItemFormData = z.infer<ReturnType<typeof buildAddPurchaseOrderItemSchema>>;

// Pass `minQty` when the line has already been received against — the ordered quantity cannot drop below it
export function buildUpdatePurchaseOrderItemSchema(options: { orderDate: string; minQty?: number }) {
  const { orderDate, minQty } = options;
  return z
    .object({
      uomQty: zodNumericField({
        required: 'Quantity is required',
        positive: true,
        ...(minQty != null && minQty > 0
          ? { min: minQty, minMessage: `Cannot be less than received quantity (${minQty}).` }
          : {}),
      }),
      unitPrice: zodCurrencyField({ required: 'Unit price is required.' }),
      expectedDeliveryDate: expectedDeliveryField,
      followPoTaxDate: z.boolean(),
      taxDate: z.string().nullish(),
      ...poSchemeShape,
    })
    .superRefine((data, ctx) => {
      enforceSchemeRatio(data, ctx);
      if (data.followPoTaxDate || data.taxDate) return;
      ctx.addIssue({ code: 'custom', path: ['taxDate'], message: 'Tax date is required' });
    })
    .refine(
      (data) => expectedDeliveryOnOrAfterOrderDate.check({ ...data, orderDate }),
      expectedDeliveryOnOrAfterOrderDate.params,
    );
}

export type UpdatePurchaseOrderItemFormData = z.infer<ReturnType<typeof buildUpdatePurchaseOrderItemSchema>>;

export const setPurchaseOrderConversionRateSchema = z.object({
  currencyCode: currencyCodeField,
  rate: zodNumericField({ required: 'Rate is required', positive: true, nonZero: true }),
});

export type SetPurchaseOrderConversionRateFormData = z.infer<typeof setPurchaseOrderConversionRateSchema>;

export const changePurchaseOrderExchangeRateSchema = z.object({
  exchangeRate: zodNumericField({ required: 'Exchange rate is required', positive: true, nonZero: true }),
});

export type ChangePurchaseOrderExchangeRateFormData = z.infer<typeof changePurchaseOrderExchangeRateSchema>;

export const updatePurchaseOrderTaxDateSchema = z.object({ taxDate: taxDateField });

export type UpdatePurchaseOrderTaxDateFormData = z.infer<typeof updatePurchaseOrderTaxDateSchema>;

export const updatePurchaseOrderNotesSchema = z.object({
  notes: z.string(),
});

export type UpdatePurchaseOrderNotesFormData = z.infer<typeof updatePurchaseOrderNotesSchema>;

// `rateCurrency` is set when the new supplier moves the order into a foreign currency; its rate is then required
export const changePurchaseOrderSupplierSchema = z
  .object({
    supplierId: z.uuid('Supplier is required'),
    rateCurrency: z.string().optional(),
    exchangeRate: zodNumericField({ positive: true, nonZero: true }).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.rateCurrency || data.exchangeRate != null) return;
    ctx.addIssue({
      code: 'custom',
      path: ['exchangeRate'],
      message: `Enter how much 1 ${data.rateCurrency} is in the company's currency.`,
    });
  });

export type ChangePurchaseOrderSupplierFormData = z.infer<typeof changePurchaseOrderSupplierSchema>;

export const sendPurchaseOrderEmailSchema = z.object({
  email: z.email('Enter a valid email address').or(z.literal('')),
});

export type SendPurchaseOrderEmailFormData = z.infer<typeof sendPurchaseOrderEmailSchema>;
