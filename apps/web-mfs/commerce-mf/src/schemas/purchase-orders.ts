import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierCurrencyCode: z.string().optional(),
  currencyCode: z.string().regex(/^[A-Z]{3}$/, 'Currency is required'),
  conversionRate: z.string().optional(),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedBy: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
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
  notes: string | null;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  supplierUnitPrice: number;
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface GoodsReceiptItemData {
  id: string;
  purchaseOrderItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string | null;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string | null;
}

export interface GoodsReceiptData {
  id: string;
  grNumber: string;
  supplierId: string;
  status: 'DRAFT' | 'POSTED';
  supplierName: string | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  receivedBy: string | null;
  receivedDate: string;
  notes: string | null;
  createdAt: string;
  items: GoodsReceiptItemData[];
}

export type PurchaseOrderDetail = PurchaseOrderData;
