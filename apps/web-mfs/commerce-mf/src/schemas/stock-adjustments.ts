import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export type StockAdjustmentType = 'WASTE' | 'DAMAGE' | 'THEFT' | 'EXPIRED' | 'CORRECTION' | 'PRODUCTION' | 'OPENING_STOCK';

export interface StockAdjustmentData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  type: StockAdjustmentType;
  quantity: number;
  reason: string | null;
  adjustedBy: string | null;
  batchId: string | null;
  locationId: string | null;
  createdAt: string;
}

export type StockAdjustmentsTableResponse = TableResponse<StockAdjustmentData>;

const baseSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  type: z.enum(['OPENING_STOCK', 'WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION', 'PRODUCTION'], {
    message: 'Adjustment type is required',
  }),
  quantity: z.string().min(1, 'Quantity is required'),
  reason: z.string().optional(),
  locationId: z.string().optional(),
  batchId: z.string().optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const createStockAdjustmentSchema = baseSchema.superRefine((data, ctx) => {
  if (data.type === 'OPENING_STOCK' && !data.locationId) {
    ctx.addIssue({ code: 'custom', path: ['locationId'], message: 'Location is required for opening stock' });
  }
  if (data.type !== 'OPENING_STOCK' && !data.batchId) {
    ctx.addIssue({ code: 'custom', path: ['batchId'], message: 'Batch is required' });
  }
});

export type CreateStockAdjustmentFormData = z.infer<typeof createStockAdjustmentSchema>;
