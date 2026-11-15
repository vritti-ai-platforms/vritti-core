import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export interface InventoryItemLocationData {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createInventoryItemLocationSchema = z.object({
  locationId: z.uuid('Location is required'),
  isBlocked: z.boolean(),
});

export type CreateInventoryItemLocationFormData = z.infer<typeof createInventoryItemLocationSchema>;

export interface UpdateInventoryItemLocationPayload {
  locationConfigId: string;
  isBlocked: boolean;
}

export type InventoryItemLocationsTableResponse = TableResponse<InventoryItemLocationData>;
