import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const GoodsReceiptStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type GoodsReceiptStatus = (typeof GoodsReceiptStatus)[keyof typeof GoodsReceiptStatus];

export const goodsReceiptStatusLabels: Record<GoodsReceiptStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export const goodsReceiptStatusConfig: Record<GoodsReceiptStatus, { label: string; variant: 'default' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  PUBLISHED: { label: 'Published', variant: 'default' },
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

export type InventoryTracking = 'quantity' | 'lot' | 'lot_serial' | 'serial';
export const InventoryTrackingValues = {
  QUANTITY: 'quantity' as const,
  LOT: 'lot' as const,
  LOT_SERIAL: 'lot_serial' as const,
  SERIAL: 'serial' as const,
};

export interface GoodsReceiptItemData {
  id: string;
  goodsReceiptId: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  inventoryItemTracking: InventoryTracking;
  inventoryItemUomSymbol: string | null;
  // derived from sum(lines.quantity)
  acceptedQuantity: number;
  rejectedQuantity: number;
  lotsCount: number;
  linesCount: number;
  isBalanced: boolean;
  poOrderedQuantity: number | null;
  poReceivedQuantity: number | null;
  poRemainingQuantity: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptLotData {
  id: string;
  goodsReceiptItemId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  resolvedLotId: string | null;
  linesCount: number;
  totalQuantity: number;
  isBalanced: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptLineData {
  id: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  // denormalized lot info (display only):
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  quantity: number;
  resolvedQuantId: string | null;
  isBalanced: boolean;
  lineItemsCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptLineItemData {
  id: string;
  goodsReceiptLineId: string;
  serialNumber: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GoodsReceiptTreeNode {
  id: string;
  name: string;
  // [itemId] | [itemId, lotId] | [itemId, lotId, lineId]
  path: string[];
  kind: 'item' | 'lot' | 'line';
  // item-only:
  inventoryItemId?: string;
  inventoryItemTracking?: InventoryTracking;
  inventoryItemUomSymbol?: string;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  poOrderedQuantity?: number | null;
  poReceivedQuantity?: number | null;
  poRemainingQuantity?: number | null;
  // lot-only:
  totalQuantity?: number;
  linesCount?: number;
  // line-only:
  quantity?: number;
  lineItemsCount?: number;
  isBalanced: boolean;
  children?: GoodsReceiptTreeNode[];
}

export type GoodsReceiptsTableResponse = TableResponse<GoodsReceiptData>;
export type GoodsReceiptItemsTableResponse = TableResponse<GoodsReceiptItemData>;
export type GoodsReceiptLinesTableResponse = TableResponse<GoodsReceiptLineData>;
export type GoodsReceiptLineItemsTableResponse = TableResponse<GoodsReceiptLineItemData>;

export const addGoodsReceiptItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  rejectedQuantity: z.string().optional(),
});
export type AddGoodsReceiptItemFormData = z.infer<typeof addGoodsReceiptItemSchema>;

export const updateGoodsReceiptItemSchema = z.object({
  rejectedQuantity: z.string().optional(),
});
export type UpdateGoodsReceiptItemFormData = z.infer<typeof updateGoodsReceiptItemSchema>;

export const addGoodsReceiptLotSchema = z
  .object({
    lotNumber: z.string().min(1, 'Lot number is required').max(100),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().min(1, 'Expiry date is required'),
  })
  .refine(
    (data) => !data.manufacturingDate || new Date(data.expiryDate) > new Date(data.manufacturingDate),
    { message: 'Expiry date must be after manufacturing date', path: ['expiryDate'] },
  );
export type AddGoodsReceiptLotFormData = z.infer<typeof addGoodsReceiptLotSchema>;

export const addGoodsReceiptLineSchema = z.object({
  goodsReceiptLotId: z.string().optional(),
  locationId: z.string().min(1, 'Location is required'),
  quantity: z.string().min(1, 'Quantity is required'),
});
export type AddGoodsReceiptLineFormData = z.infer<typeof addGoodsReceiptLineSchema>;

export const addGoodsReceiptLineItemSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
});
export type AddGoodsReceiptLineItemFormData = z.infer<typeof addGoodsReceiptLineItemSchema>;
