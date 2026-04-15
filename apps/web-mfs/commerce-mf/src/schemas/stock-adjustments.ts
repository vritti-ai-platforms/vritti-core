import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export type StockAdjustmentType =
  | 'WASTE'
  | 'DAMAGE'
  | 'THEFT'
  | 'EXPIRED'
  | 'CORRECTION'
  | 'PRODUCTION'
  | 'OPENING_STOCK';

export type StockAdjustmentStatus = 'DRAFT' | 'PUBLISHED';

export interface StockAdjustmentLineData {
  id: string;
  stockAdjustmentId: string;
  createdById: string;
  batchId: string;
  batchNumber: string;
  locationId: string;
  locationName: string;
  quantity: number;
  lineItemsCount: number;
  lineItemsQuantitySum: number;
  lineItemsDelta: number;
  isBalanced: boolean;
  isLineItemsBalanced: boolean;
  manufacturingDate: string;
  expiryDate: string;
  createdAt: string;
}

export interface StockAdjustmentLineItemData {
  id: string;
  stockAdjustmentLineId: string;
  inventoryItemId: string;
  quantity: number;
  createdAt: string;
}

export interface StockAdjustmentData {
  id: string;
  code: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemUomSymbol: string;
  type: StockAdjustmentType;
  status: StockAdjustmentStatus;
  reason: string | null;
  createdById: string;
  createdByFullName: string;
  isPublishable: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export type StockAdjustmentsTableResponse = TableResponse<StockAdjustmentData>;
export type StockAdjustmentLinesTableResponse = TableResponse<StockAdjustmentLineData>;
export type StockAdjustmentLineItemsTableResponse = TableResponse<StockAdjustmentLineItemData>;

export const createStockAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  type: z.enum(['OPENING_STOCK', 'WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION', 'PRODUCTION'], {
    message: 'Adjustment type is required',
  }),
  reason: z.string().min(1, 'Reason is required'),
});

export type CreateStockAdjustmentFormData = z.infer<typeof createStockAdjustmentSchema>;

export const addStockAdjustmentLineSchema = z.object({
  batchId: z.string().optional(),
  locationId: z.string().optional(),
  quantity: z.string().min(1, 'Quantity is required'),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

export type AddStockAdjustmentLineFormData = z.infer<typeof addStockAdjustmentLineSchema>;
