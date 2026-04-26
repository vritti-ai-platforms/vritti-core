import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const GoodsReceiptStatus = {
  DRAFT: 'DRAFT',
  ALLOCATION_PENDING: 'ALLOCATION_PENDING',
  PUBLISHED: 'PUBLISHED',
} as const;

export type GoodsReceiptStatus = (typeof GoodsReceiptStatus)[keyof typeof GoodsReceiptStatus];

export const goodsReceiptStatusLabels: Record<GoodsReceiptStatus, string> = {
  DRAFT: 'Draft',
  ALLOCATION_PENDING: 'Allocation Pending',
  PUBLISHED: 'Published',
};

export const createGoodsReceiptSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseOrderId: z.string().optional(),
  receivedDate: z.string().min(1, 'Received date is required'),
  notes: z.string().optional(),
});
export type CreateGoodsReceiptFormData = z.infer<typeof createGoodsReceiptSchema>;

export interface GoodsReceiptPoData {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedBy: string | null;
  totalAmount: { currency: string; value: number };
}

export interface GoodsReceiptData {
  id: string;
  grNumber: string;
  supplierId: string;
  status: GoodsReceiptStatus;
  isPublishable?: boolean;
  supplierName: string;
  po: GoodsReceiptPoData | null;
  receivedBy: string | null;
  receivedDate: string;
  notes: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export type InventoryTracking = 'quantity' | 'lot' | 'serial';

export interface GoodsReceiptItemData {
  id: string;
  goodsReceiptId: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  inventoryItemTracking: InventoryTracking;
  acceptedQuantity: number;
  rejectedQuantity: number;
  poItem: { orderedQuantity: number; receivedQuantity: number } | null;
  createdAt: string;
}

export interface GoodsReceiptBatchData {
  id: string;
  goodsReceiptLineId: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  locationId: string;
  locationName: string | null;
  quantity: number;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  batchItemsCount: number;
  isBalanced: boolean;
  createdAt: string;
}

export interface GoodsReceiptBatchItemData {
  id: string;
  goodsReceiptBatchId: string;
  serialNumber: string;
  createdAt: string;
}

export type GoodsReceiptsTableResponse = TableResponse<GoodsReceiptData>;
export type GoodsReceiptItemsTableResponse = TableResponse<GoodsReceiptItemData>;
