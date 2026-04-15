import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export interface StorageLocationConfigData {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string | null;
  reorderLevel: number;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export const createStorageLocationConfigSchema = z.object({
  locationId: z.uuid('Location is required'),
  reorderLevel: z.coerce.number<number>().min(0, 'Must be 0 or more'),
});

export const updateStorageLocationConfigSchema = z.object({
  reorderLevel: z.coerce.number<number>().min(0, 'Must be 0 or more'),
});

export type CreateStorageLocationConfigFormData = z.infer<typeof createStorageLocationConfigSchema>;
export type UpdateStorageLocationConfigFormData = z.infer<typeof updateStorageLocationConfigSchema>;

export type StorageLocationConfigsTableResponse = TableResponse<StorageLocationConfigData>;
