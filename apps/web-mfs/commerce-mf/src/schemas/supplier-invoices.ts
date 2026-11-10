import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { PurchaseOrderStatus } from '@/schemas/purchase-orders';

export type SupplierInvoiceStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export const SUPPLIER_INVOICE_STATUS_LABELS: Record<SupplierInvoiceStatus, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled',
};

export type SupplierInvoiceFlagCode =
  | 'BATCH_NOT_RECEIVED'
  | 'EXPIRY_DIFFERS'
  | 'MRP_DIFFERS'
  | 'BILLED_MORE_THAN_RECEIVED'
  | 'BILLED_MORE_THAN_ORDERED'
  | 'PRICE_DIFFERS'
  | 'FREE_SHORT'
  | 'SHORT_EXPIRY'
  | 'RATE_DIFFERS';

export const SUPPLIER_INVOICE_FLAG_LABELS: Record<SupplierInvoiceFlagCode, string> = {
  BATCH_NOT_RECEIVED: 'Batch not received',
  EXPIRY_DIFFERS: 'Expiry differs',
  MRP_DIFFERS: 'MRP differs',
  BILLED_MORE_THAN_RECEIVED: 'Billed over received',
  BILLED_MORE_THAN_ORDERED: 'Billed over ordered',
  PRICE_DIFFERS: 'Price differs',
  FREE_SHORT: 'Free goods short',
  SHORT_EXPIRY: 'Short expiry',
  RATE_DIFFERS: 'Rate differs',
};

export const INVOICEABLE_PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = [
  'CONFIRMED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CLOSED',
];

const invoiceHeaderFields = {
  invoiceNumber: z
    .string({ error: 'Invoice number is required' })
    .min(1, 'Invoice number is required')
    .max(100, 'Invoice number must be at most 100 characters'),
  invoiceDate: z.string({ error: 'Invoice date is required' }).min(1, 'Invoice date is required'),
  taxDate: z.string({ error: 'Tax date is required' }).min(1, 'Tax date is required'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters'),
};

export const createSupplierInvoiceSchema = z.object({
  purchaseOrderId: z.uuid('Purchase order is required'),
  ...invoiceHeaderFields,
});

export type CreateSupplierInvoiceFormData = z.infer<typeof createSupplierInvoiceSchema>;

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

export const supplierInvoiceLineSchema = z.object({
  purchaseOrderItemId: z.uuid('Order line is required'),
  lotNumber: z.string().max(100, 'Batch must be at most 100 characters'),
  expiryDate: z.string().nullable().optional(),
  mrp: zodCurrencyField({ optional: true, positive: true }),
  billedQty: zodNumericField({ required: 'Billed quantity is required', positive: true, nonZero: true }),
  freeQty: zodNumericField({ required: 'Free quantity is required', min: 0 }),
  unitPrice: zodCurrencyField({ required: 'Unit price is required', positive: true }),
  discountAmount: zodCurrencyField({ optional: true }),
  taxAmount: zodCurrencyField({ optional: true }),
});

export type SupplierInvoiceLineFormData = z.infer<typeof supplierInvoiceLineSchema>;

export interface SupplierInvoiceFlag {
  code: SupplierInvoiceFlagCode;
  detail: string;
}

export interface SupplierInvoiceLineReceipt {
  goodsReceiptId: string;
  grNumber: string;
  lotNumber: string | null;
  quantity: number;
}

export interface SupplierInvoiceLine {
  id: string;
  supplierInvoiceId: string;
  purchaseOrderItemId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: CurrencyValue;
  billedQty: number;
  freeQty: number;
  unitPrice: CurrencyValue;
  discountAmount: CurrencyValue;
  taxAmount: CurrencyValue;
  lineTotal: CurrencyValue;
  varianceAmount: CurrencyValue;
  flags: SupplierInvoiceFlag[];
  receipts: SupplierInvoiceLineReceipt[];
}

export interface SupplierInvoice {
  id: string;
  legalEntityId: string;
  siteId: string;
  siteName: string | null;
  siteCode: string | null;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  poNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string;
  currencyCode: string;
  exchangeRate: number;
  poExchangeRate: number;
  status: SupplierInvoiceStatus;
  subtotal: CurrencyValue;
  discountAmount: CurrencyValue;
  taxAmount: CurrencyValue;
  totalAmount: CurrencyValue;
  flags: SupplierInvoiceFlag[];
  flagCount: number;
  lineCount: number;
  notes: string | null;
  postedAt: string | null;
  canEdit: boolean;
  canPost: boolean;
  canCancel: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoiceDetail extends SupplierInvoice {
  lines: SupplierInvoiceLine[];
}

export type SupplierInvoicesTableResponse = TableResponse<SupplierInvoice>;

export type SupplierInvoiceRef = Pick<SupplierInvoice, 'id' | 'supplierId'>;

export interface CreateSupplierInvoicePayload {
  purchaseOrderId: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxDate: string;
  notes: string | null;
}

export interface UpdateSupplierInvoicePayload {
  invoiceNumber: string;
  invoiceDate: string;
  taxDate?: string;
  exchangeRate?: number;
  notes: string | null;
}

export interface SupplierInvoiceLinePayload {
  purchaseOrderItemId: string;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: CurrencyValue | null;
  billedQty: number;
  freeQty: number;
  unitPrice: CurrencyValue;
  discountAmount?: CurrencyValue;
  taxAmount?: CurrencyValue;
}

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
