import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const createGoodsReceiptSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseOrderId: z.string().optional(),
  receivedDate: z.string().min(1, 'Received date is required'),
  notes: z.string().optional(),
});
export type CreateGoodsReceiptFormData = z.infer<typeof createGoodsReceiptSchema>;

export interface GoodsReceiptItemData {
  id: string;
  purchaseOrderItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string | null;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string | null;
  batchNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
}

export interface GoodsReceiptPoData {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedBy: string | null;
  totalAmount: { currency: string; value: number } | null;
}

export interface GoodsReceiptData {
  id: string;
  grNumber: string;
  supplierId: string;
  status: 'DRAFT' | 'POSTED';
  supplierName: string;
  po: GoodsReceiptPoData | null;
  receivedBy: string | null;
  receivedDate: string;
  notes: string | null;
  createdAt: string;
  items: GoodsReceiptItemData[];
}

export type GoodsReceiptsTableResponse = TableResponse<GoodsReceiptData>;
