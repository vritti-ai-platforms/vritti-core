import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1, 'Item is required'),
        orderedQuantity: z.string().min(1, 'Quantity is required'),
      }),
    )
    .optional(),
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseOrdersTableResponse = TableResponse<PurchaseOrderData>;

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderData {
  id: string;
  supplierId: string;
  supplierName: string | null;
  poNumber: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string | null;
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
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface GoodsReceiptItemData {
  id: string;
  purchaseOrderItemId: string;
  inventoryItemName: string | null;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string | null;
}

export interface GoodsReceiptData {
  id: string;
  purchaseOrderId: string;
  receivedBy: string | null;
  receivedDate: string;
  notes: string | null;
  createdAt: string;
  items: GoodsReceiptItemData[];
}

export interface PurchaseOrderDetail extends PurchaseOrderData {
  items: PurchaseOrderItemData[];
}
