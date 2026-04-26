import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(100),
  type: z.enum(['MATERIAL', 'PRODUCT']),
  tracking: z.enum(['quantity', 'lot', 'serial']),
  categoryId: z.string().uuid('Category is required'),
  description: z.string().optional(),
  uomId: z.string().uuid('Unit of measure is required'),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(100).optional(),
  type: z.enum(['MATERIAL', 'PRODUCT']).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.uuid('Category is required').optional(),
  uomId: z.uuid('Unit of measure is required').optional(),
});

export type CreateInventoryItemFormData = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemFormData = z.infer<typeof updateInventoryItemSchema>;
export type InventoryItemsTableResponse = TableResponse<InventoryItemData>;

export type InventoryItemType = 'MATERIAL' | 'PRODUCT';
export type InventoryTracking = 'quantity' | 'lot' | 'serial';

export interface InventoryItemData {
  id: string;
  name: string;
  code: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  categoryId: string;
  categoryName: string | null;
  description: string | null;
  uomId: string;
  uomSymbol: string | null;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}
