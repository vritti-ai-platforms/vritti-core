import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const createPurchaseOrderSchema = z
  .object({
    supplierId: z.string().min(1, 'Supplier is required'),
    supplierCurrencyCode: z.string().optional(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/, 'Currency is required'),
    conversionRate: z.string().optional(),
    orderDate: z.string().min(1, 'Order date is required'),
    expectedBy: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.supplierCurrencyCode) return;

    if (data.currencyCode === data.supplierCurrencyCode) return;

    if (!data.conversionRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conversionRate'],
        message: 'Conversion rate is required when PO currency differs from supplier currency.',
      });
      return;
    }

    const parsed = Number(data.conversionRate);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conversionRate'],
        message: 'Conversion rate must be greater than 0.',
      });
    }
  });

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseOrdersTableResponse = TableResponse<PurchaseOrderData>;
export type PurchaseOrderItemsTableResponse = TableResponse<PurchaseOrderItemData>;

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export const PurchaseOrderStatusValues = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export const purchaseOrderStatusConfig: Record<
  PurchaseOrderStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  SENT: { label: 'Sent', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'secondary', className: 'bg-success/15 text-success' },
  PARTIALLY_RECEIVED: { label: 'Partial', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  RECEIVED: { label: 'Received', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export interface PurchaseOrderData {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCurrencyCode: string | null;
  poNumber: string;
  status: PurchaseOrderStatus;
  currencyCode: string;
  conversionRate: number;
  orderDate: string;
  expectedBy: string | null;
  timezone: string;
  notes: string | null;
  totalAmount: { currency: string; value: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  supplierUnitPrice: { currency: string; value: string };
  unitPrice: { currency: string; value: string };
  totalPrice: { currency: string; value: string };
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
    totalAmount: { currency: string; value: number } | null;
  } | null;
  receivedBy: string | null;
  receivedDate: string;
  notes: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export type PurchaseOrderDetail = PurchaseOrderData;
