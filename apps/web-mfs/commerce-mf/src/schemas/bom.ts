import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export const bomLineSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  requiredQuantity: z.string().min(1, 'Quantity is required'),
});

export const createBomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(100),
  isActive: z.boolean().optional(),
  lines: z.array(bomLineSchema).optional(),
});

export const updateBomSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  lines: z.array(bomLineSchema).optional(),
});

export type BomLineFormData = z.infer<typeof bomLineSchema>;
export type CreateBomFormData = z.infer<typeof createBomSchema>;
export type UpdateBomFormData = z.infer<typeof updateBomSchema>;
export type BomTableResponse = TableResponse<BomData>;

export interface BomData {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BomLineData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  requiredQuantity: number;
}

export interface BomDetail extends BomData {
  lines: BomLineData[];
}
