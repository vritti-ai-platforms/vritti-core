import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export interface InventoryItemLocationData {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
}

export const createInventoryItemLocationSchema = z.object({
  locationId: z.uuid('Location is required'),
  reorderLevel: zodNumericField({ required: 'Min stock level is required', min: 0 }),
});

export const updateInventoryItemLocationSchema = z.object({
  reorderLevel: zodNumericField({ required: 'Min stock level is required', min: 0 }),
});

export type CreateInventoryItemLocationFormData = z.infer<typeof createInventoryItemLocationSchema>;
export type UpdateInventoryItemLocationFormData = z.infer<typeof updateInventoryItemLocationSchema>;

export type InventoryItemLocationsTableResponse = TableResponse<InventoryItemLocationData>;
