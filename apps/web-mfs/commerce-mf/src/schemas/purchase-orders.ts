import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField, zodNumericField } from '@vritti/quantum-ui/zod';

export const ExchangeRateTypeEnum = z.enum(['FIXED', 'VARIABLE']);
export type ExchangeRateType = z.infer<typeof ExchangeRateTypeEnum>;

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierCurrencyCode: z.string().optional(),
  exchangeRateType: ExchangeRateTypeEnum,
  exchangeRate: zodNumericField({ positive: true, nonZero: true }).optional(),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseOrdersTableResponse = TableResponse<PurchaseOrderData>;
export type PurchaseOrderItemsTableResponse = TableResponse<PurchaseOrderItemData>;

export type PurchaseOrderStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DRAFT'
  | 'SENT'
  | 'CONFIRMED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED'
  | 'CANCELLED';

export const PurchaseOrderStatusValues = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export const purchaseOrderStatusConfig: Record<
  PurchaseOrderStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'outline' },
  APPROVED: { label: 'Approved', variant: 'secondary' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  DRAFT: { label: 'Draft', variant: 'outline' },
  SENT: { label: 'Sent', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'secondary', className: 'bg-success/15 text-success' },
  PARTIALLY_RECEIVED: { label: 'Partial', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  RECEIVED: { label: 'Received', variant: 'secondary', className: 'bg-success/15 text-success' },
  CLOSED: { label: 'Closed', variant: 'secondary', className: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export interface PurchaseOrderData {
  id: string;
  supplierId: string;
  supplierName: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  exchangeRate: number | null;
  exchangeRateType: ExchangeRateType;
  orderDate: string;
  expectedBy: string | null;
  timezone: string;
  notes: string | null;
  totalAmount: { currency: string; value: string };
  goodsReceiptExists: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomQty: number;
  receivedQuantity: number;
  currencyCode: string;
  unitPrice: { currency: string; value: string };
  totalPrice: { currency: string; value: string };
  primaryUomQty: number;
  orderUomSymbol: string | null;
  primaryUomSymbol: string | null;
  primaryUomUnitPrice: { currency: string; value: string };
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  freeQty: number;
}

export interface GoodsReceiptData {
  id: string;
  grNumber: string;
  supplierId: string;
  status: 'DRAFT' | 'ALLOCATION_PENDING' | 'PUBLISHED';
  supplierName: string | null;
  po: {
    id: string;
    poNumber: string;
    orderDate: string;
    expectedBy: string | null;
    totalAmount: { currency: string; value: string };
  } | null;
  receivedDate: string;
  notes: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export type PurchaseOrderDetail = PurchaseOrderData;

// Free-goods scheme inputs (buy + free ratio). free_qty is derived server-side from uomQty.
const poSchemeShape = {
  schemeBuyQty: zodNumericField({ integer: true, positive: true }).optional(),
  schemeFreeQty: zodNumericField({ integer: true, positive: true }).optional(),
  hasScheme: z.boolean(),
};

// When a scheme is enabled, the buy/free ratio is required.
const enforceSchemeRatio = (
  data: { hasScheme: boolean; schemeBuyQty?: number | null; schemeFreeQty?: number | null },
  ctx: z.RefinementCtx,
) => {
  if (!data.hasScheme) return;
  if (data.schemeBuyQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeBuyQty'], message: 'Buy qty is required for a scheme.' });
  }
  if (data.schemeFreeQty == null) {
    ctx.addIssue({ code: 'custom', path: ['schemeFreeQty'], message: 'Free qty is required for a scheme.' });
  }
};

export const addPurchaseOrderItemSchema = z
  .object({
    supplierItemId: z.string().min(1, 'Item is required'),
    uomQty: zodNumericField({ required: 'Quantity is required', positive: true }),
    unitPrice: zodCurrencyField({ required: 'Unit price is required.' }),
    ...poSchemeShape,
  })
  .superRefine(enforceSchemeRatio);

export type AddPurchaseOrderItemFormData = z.infer<typeof addPurchaseOrderItemSchema>;

// Pass `minQty` when the line has already been received against — the form will then block
// reducing the ordered qty below what's been received. Defaults to no minimum.
export function buildUpdatePurchaseOrderItemSchema(options: { minQty?: number } = {}) {
  const { minQty } = options;
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
      ...poSchemeShape,
    })
    .superRefine(enforceSchemeRatio);
}

export type UpdatePurchaseOrderItemFormData = z.infer<ReturnType<typeof buildUpdatePurchaseOrderItemSchema>>;

export const updatePurchaseOrderNotesSchema = z.object({
  notes: z.string().optional(),
});

export type UpdatePurchaseOrderNotesFormData = z.infer<typeof updatePurchaseOrderNotesSchema>;

export const changePurchaseOrderSupplierSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
});

export type ChangePurchaseOrderSupplierFormData = z.infer<typeof changePurchaseOrderSupplierSchema>;

export const sendPurchaseOrderEmailSchema = z.object({
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
});

export type SendPurchaseOrderEmailFormData = z.infer<typeof sendPurchaseOrderEmailSchema>;
