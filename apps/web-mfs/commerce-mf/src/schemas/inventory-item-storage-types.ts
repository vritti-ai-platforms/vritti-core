import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export interface InventoryItemStorageTypeData {
  id: string;
  storageTypeId: string;
  storageTypeName: string;
  maxQuantity: number;
  uomId: string;
  uomSymbol: string | null;
}

export const updateInventoryItemStorageTypeSchema = z.object({
  maxQuantity: zodNumericField({ required: 'Max per location is required', positive: true }),
  uomId: z.uuid('Unit is required'),
});

export const addInventoryItemStorageTypeSchema = updateInventoryItemStorageTypeSchema.extend({
  storageTypeId: z.uuid('Storage type is required'),
});

export type AddInventoryItemStorageTypeFormData = z.infer<typeof addInventoryItemStorageTypeSchema>;
export type UpdateInventoryItemStorageTypeFormData = z.infer<typeof updateInventoryItemStorageTypeSchema>;
