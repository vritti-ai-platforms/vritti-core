import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export type StockAdjustmentType = 'WASTE' | 'DAMAGE' | 'THEFT' | 'EXPIRED' | 'CORRECTION' | 'PRODUCTION';

export interface StockAdjustmentData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  type: StockAdjustmentType;
  quantity: number;
  reason: string | null;
  adjustedBy: string | null;
  createdAt: string;
}

export type StockAdjustmentsTableResponse = TableResponse<StockAdjustmentData>;

export const createStockAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  type: z.enum(['WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION', 'PRODUCTION'], { message: 'Adjustment type is required' }),
  quantity: z.string().min(1, 'Quantity is required'),
  reason: z.string().optional(),
});

export type CreateStockAdjustmentFormData = z.infer<typeof createStockAdjustmentSchema>;
