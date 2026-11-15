import type { BadgeProps } from '@vritti/quantum-ui/Badge';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import Decimal from '@vritti/quantum-ui/decimal';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { PurchaseRef } from './purchases';

export const SupplierInvoiceStatusValues = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  CANCELLED: 'CANCELLED',
} as const;
export type SupplierInvoiceStatus = (typeof SupplierInvoiceStatusValues)[keyof typeof SupplierInvoiceStatusValues];

export const SUPPLIER_INVOICE_STATUS_LABELS: Record<SupplierInvoiceStatus, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled',
};

export type SupplierInvoiceSource = 'ENTERED' | 'SELF_INVOICED';

export const SUPPLIER_INVOICE_SOURCE_LABELS: Record<SupplierInvoiceSource, string> = {
  ENTERED: 'Entered',
  SELF_INVOICED: 'Self-invoiced',
};

export type SupplierInvoicePaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export const supplierInvoicePaymentStatusConfig: Record<
  SupplierInvoicePaymentStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  UNPAID: { label: 'Unpaid', variant: 'outline' },
  PARTIAL: { label: 'Partially Paid', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
};

export type SupplierInvoiceLineType = 'ITEM' | 'CHARGE';

export const SUPPLIER_INVOICE_LINE_TYPE_LABELS: Record<SupplierInvoiceLineType, string> = {
  ITEM: 'Item',
  CHARGE: 'Charge',
};

export type SupplierInvoiceHoldCode =
  | 'PRICE_DIFFERS'
  | 'INVOICED_MORE_THAN_ORDERED'
  | 'FREE_SHORT'
  | 'RATE_DIFFERS'
  | 'SHORT_EXPIRY'
  | 'QTY_NOT_RECEIVED'
  | 'QTY_NOT_RELEASED';

export const SUPPLIER_INVOICE_HOLD_LABELS: Record<SupplierInvoiceHoldCode, string> = {
  PRICE_DIFFERS: 'Price differs',
  INVOICED_MORE_THAN_ORDERED: 'Invoiced over ordered',
  FREE_SHORT: 'Free goods short',
  RATE_DIFFERS: 'Rate differs',
  SHORT_EXPIRY: 'Short expiry',
  QTY_NOT_RECEIVED: 'Not yet received',
  QTY_NOT_RELEASED: 'Not yet released',
};

export const SupplierInvoiceHoldStatusValues = {
  OPEN: 'OPEN',
  RELEASED: 'RELEASED',
  RESOLVED: 'RESOLVED',
} as const;
export type SupplierInvoiceHoldStatus =
  (typeof SupplierInvoiceHoldStatusValues)[keyof typeof SupplierInvoiceHoldStatusValues];

export const supplierInvoiceHoldStatusConfig: Record<
  SupplierInvoiceHoldStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  OPEN: { label: 'Open', variant: 'warning' },
  RELEASED: { label: 'Released', variant: 'secondary' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
};

const currencyCodeField = z.string({ error: 'Currency is required' }).regex(/^[A-Z]{3}$/, 'Currency is required');

const invoiceHeaderFields = {
  invoiceNumber: z
    .string({ error: 'Invoice number is required' })
    .min(1, 'Invoice number is required')
    .max(100, 'Invoice number must be at most 100 characters'),
  invoiceDate: z.string({ error: 'Invoice date is required' }).min(1, 'Invoice date is required'),
  taxDate: z.string({ error: 'Tax date is required' }).min(1, 'Tax date is required'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters'),
};

// `requiresSite` adds the site picker of a legal entity entering an invoice for one of its sites; the exchange rate is
// asked only for a currency other than the legal entity's
export function buildCreateSupplierInvoiceSchema({
  requiresSite,
  leCurrencyCode,
}: {
  requiresSite: boolean;
  leCurrencyCode: string;
}) {
  return z
    .object({
      supplierId: z.uuid('Supplier is required'),
      siteId: requiresSite ? z.uuid('Site is required') : z.uuid().optional(),
      currencyCode: currencyCodeField,
      exchangeRate: zodNumericField({ positive: true, nonZero: true }).optional(),
      ...invoiceHeaderFields,
    })
    .superRefine((data, ctx) => {
      if (data.currencyCode === leCurrencyCode || data.exchangeRate != null) return;
      ctx.addIssue({ code: 'custom', path: ['exchangeRate'], message: 'Exchange rate is required' });
    });
}

export type CreateSupplierInvoiceFormData = z.infer<ReturnType<typeof buildCreateSupplierInvoiceSchema>>;

// The header an invoice is edited with; the exchange rate is asked only when the invoice is in a foreign currency
export function buildEditSupplierInvoiceSchema({ foreignCurrency }: { foreignCurrency: boolean }) {
  return z.object({
    ...invoiceHeaderFields,
    exchangeRate: foreignCurrency
      ? zodNumericField({ required: 'Exchange rate is required', positive: true, nonZero: true })
      : zodNumericField({ positive: true }).optional(),
  });
}

export type EditSupplierInvoiceFormData = z.infer<ReturnType<typeof buildEditSupplierInvoiceSchema>>;

const lineAmountFields = {
  discountAmount: zodCurrencyField({ optional: true }),
  taxAmount: zodCurrencyField({ optional: true }),
  description: z.string().max(200, 'Description must be at most 200 characters'),
};

// A received batch is its receipt lot, or the receipt item itself when the item has no lots
export function invoiceableGoodsReceiptKey(receipt: {
  goodsReceiptItemId: string | null;
  goodsReceiptLotId: string | null;
}): string | undefined {
  return receipt.goodsReceiptLotId ?? receipt.goodsReceiptItemId ?? undefined;
}

// A received batch is picked by `receiptKey`, which fills the order line, receipt item and lot it stands for;
// `findReceipt` resolves it, so invoiced and free together stay within what is left to invoice of it
export function buildSupplierInvoiceItemLineSchema(
  findReceipt: (receiptKey: string) => InvoiceableGoodsReceipt | undefined,
) {
  return z
    .object({
      receiptKey: z.string({ error: 'Received batch is required' }).min(1, 'Received batch is required'),
      purchaseOrderItemId: z.uuid('Received batch is required'),
      goodsReceiptItemId: z.uuid('Received batch is required'),
      goodsReceiptLotId: z.uuid().nullish(),
      invoicedQty: zodNumericField({ required: 'Invoiced quantity is required', positive: true, nonZero: true }),
      freeQty: zodNumericField({ required: 'Free quantity is required', min: 0 }),
      unitPrice: zodCurrencyField({ required: 'Unit price is required', positive: true }),
      ...lineAmountFields,
    })
    .superRefine((data, ctx) => {
      const receipt = findReceipt(data.receiptKey);
      if (!receipt || !new Decimal(data.invoicedQty).plus(data.freeQty).gt(receipt.openQty)) return;
      ctx.addIssue({
        code: 'custom',
        path: ['invoicedQty'],
        message: `Invoiced and free together cannot exceed what is left to invoice (${receipt.openQty}).`,
      });
    });
}

export type SupplierInvoiceItemLineFormData = z.infer<ReturnType<typeof buildSupplierInvoiceItemLineSchema>>;

export const supplierInvoiceChargeLineSchema = z.object({
  costCategoryId: z.uuid('Cost category is required'),
  unitPrice: zodCurrencyField({ required: 'Amount is required', positive: true }),
  ...lineAmountFields,
});

export type SupplierInvoiceChargeLineFormData = z.infer<typeof supplierInvoiceChargeLineSchema>;

export const releaseSupplierInvoiceHoldSchema = z.object({
  reason: z
    .string({ error: 'Reason is required' })
    .trim()
    .min(1, 'Reason is required')
    .max(1000, 'Reason must be at most 1000 characters'),
});

export type ReleaseSupplierInvoiceHoldFormData = z.infer<typeof releaseSupplierInvoiceHoldSchema>;

export interface SupplierInvoiceHold {
  id: string;
  supplierInvoiceId: string;
  supplierInvoiceLineId: string | null;
  code: SupplierInvoiceHoldCode;
  detail: string;
  blocksPayment: boolean;
  status: SupplierInvoiceHoldStatus;
  releasedBy: string | null;
  releasedAt: string | null;
  releaseReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoiceLine {
  id: string;
  supplierInvoiceId: string;
  lineType: SupplierInvoiceLineType;
  purchaseOrderItemId: string | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  goodsReceiptItemId: string | null;
  goodsReceiptId: string | null;
  grNumber: string | null;
  goodsReceiptLotId: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: CurrencyValue;
  inventoryItemId: string | null;
  inventoryItemName: string | null;
  uomId: string | null;
  uomSymbol: string | null;
  primaryUomSymbol: string | null;
  invoicedQty: number | null;
  freeQty: number | null;
  invoicedPrimaryQty: number | null;
  freePrimaryQty: number | null;
  costCategoryId: string | null;
  costCategoryName: string | null;
  description: string | null;
  unitPrice: CurrencyValue;
  discountAmount: CurrencyValue;
  taxAmount: CurrencyValue;
  lineTotal: CurrencyValue;
  varianceAmount: CurrencyValue;
  holds: SupplierInvoiceHold[];
}

export interface SupplierInvoice {
  id: string;
  legalEntityId: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  supplierId: string;
  supplierName: string;
  poNumbers: string[];
  purchases: PurchaseRef[];
  isReceiveWithInvoice: boolean;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string;
  source: SupplierInvoiceSource;
  currencyCode: string;
  exchangeRate: number;
  paymentTermId: string;
  paymentTermName: string | null;
  dueDate: string;
  status: SupplierInvoiceStatus;
  paymentStatus: SupplierInvoicePaymentStatus;
  subtotal: CurrencyValue;
  discountAmount: CurrencyValue;
  taxAmount: CurrencyValue;
  totalAmount: CurrencyValue;
  openHoldCount: number;
  lineCount: number;
  notes: string | null;
  postedAt: string | null;
  isPayable: boolean;
  canEdit: boolean;
  canPost: boolean;
  canCancel: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoiceDetail extends SupplierInvoice {
  lines: SupplierInvoiceLine[];
  holds: SupplierInvoiceHold[];
}

export interface InvoiceableGoodsReceipt {
  goodsReceiptId: string;
  grNumber: string;
  receivedDate: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: CurrencyValue;
  purchaseOrderId: string;
  poNumber: string;
  purchaseOrderItemId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
  primaryUomSymbol: string | null;
  poUnitPrice: CurrencyValue;
  poExchangeRate: number;
  acceptedPrimaryQty: number;
  invoicedPrimaryQty: number;
  openPrimaryQty: number;
  openQty: number;
}

export interface InvoiceableGoodsReceiptsParams {
  purchaseOrderId?: string;
  excludeLineId?: string;
}

export type SupplierInvoicesTableResponse = TableResponse<SupplierInvoice>;

export type SupplierInvoiceRef = Pick<SupplierInvoice, 'id' | 'supplierId' | 'siteId'>;

export interface CreateSupplierInvoicePayload {
  supplierId: string;
  siteId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string;
  currencyCode: string;
  exchangeRate?: number;
  notes: string | null;
}

export interface UpdateSupplierInvoicePayload {
  invoiceNumber: string;
  invoiceDate: string;
  taxDate?: string;
  exchangeRate?: number;
  notes: string | null;
}

interface SupplierInvoiceLineAmounts {
  unitPrice: CurrencyValue;
  discountAmount?: CurrencyValue;
  taxAmount?: CurrencyValue;
  description?: string;
}

export interface SupplierInvoiceItemLinePayload extends SupplierInvoiceLineAmounts {
  lineType: 'ITEM';
  purchaseOrderItemId: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  invoicedQty: number;
  freeQty: number;
}

export interface SupplierInvoiceChargeLinePayload extends SupplierInvoiceLineAmounts {
  lineType: 'CHARGE';
  costCategoryId: string;
}

export type SupplierInvoiceLinePayload = SupplierInvoiceItemLinePayload | SupplierInvoiceChargeLinePayload;

export interface UpdateSupplierInvoiceVars {
  invoice: SupplierInvoiceRef;
  data: UpdateSupplierInvoicePayload;
}

export interface AddSupplierInvoiceLineVars {
  invoice: SupplierInvoiceRef;
  data: SupplierInvoiceLinePayload;
}

export interface UpdateSupplierInvoiceLineVars {
  invoice: SupplierInvoiceRef;
  lineId: string;
  data: SupplierInvoiceLinePayload;
}

export interface RemoveSupplierInvoiceLineVars {
  invoice: SupplierInvoiceRef;
  lineId: string;
}

export interface ReleaseSupplierInvoiceHoldVars {
  invoice: SupplierInvoiceRef;
  holdId: string;
  reason: string;
}
