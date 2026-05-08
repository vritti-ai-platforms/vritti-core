import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export interface InventoryItemLocationData {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  reorderLevel: number;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export const createInventoryItemLocationSchema = z.object({
  locationId: z.uuid('Location is required'),
  reorderLevel: z.coerce.number<number>().min(0, 'Must be 0 or more'),
});

export const updateInventoryItemLocationSchema = z.object({
  reorderLevel: z.coerce.number<number>().min(0, 'Must be 0 or more'),
});

export type CreateInventoryItemLocationFormData = z.infer<typeof createInventoryItemLocationSchema>;
export type UpdateInventoryItemLocationFormData = z.infer<typeof updateInventoryItemLocationSchema>;

export type InventoryItemLocationsTableResponse = TableResponse<InventoryItemLocationData>;
