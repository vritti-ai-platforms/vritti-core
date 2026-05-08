import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export interface InventoryItemUomConversionData {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomName: string;
  uomSymbol: string;
  numerator: number;
  denominator: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemUomConversionsTableResponse = TableResponse<InventoryItemUomConversionData>;

const positiveInt = z.coerce.number<number>().int('Must be a whole number').min(1, 'Must be at least 1');

export const createInventoryItemUomConversionSchema = z.object({
  uomId: z.string().uuid('UOM is required'),
  numerator: positiveInt,
  denominator: positiveInt,
});

export const updateInventoryItemUomConversionSchema = z.object({
  numerator: positiveInt,
  denominator: positiveInt,
});

export type CreateInventoryItemUomConversionFormData = z.infer<typeof createInventoryItemUomConversionSchema>;
export type UpdateInventoryItemUomConversionFormData = z.infer<typeof updateInventoryItemUomConversionSchema>;
