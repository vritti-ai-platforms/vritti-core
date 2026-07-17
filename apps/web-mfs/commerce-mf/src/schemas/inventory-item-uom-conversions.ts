import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export interface InventoryItemUomConversionData {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomName: string;
  uomSymbol: string;
  primaryUomQty: number;
  uomQty: number;
  toPrimaryConversionFactor: number;
  toUomConversionFactor: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemUomConversionsTableResponse = TableResponse<InventoryItemUomConversionData>;

const positiveInt = zodNumericField({ required: 'Value is required', positive: true, integer: true });

export const createInventoryItemUomConversionSchema = z.object({
  uomId: z.uuid('UOM is required'),
  primaryUomQty: positiveInt,
  uomQty: positiveInt,
});

export const updateInventoryItemUomConversionSchema = z.object({
  primaryUomQty: positiveInt,
  uomQty: positiveInt,
});

export type CreateInventoryItemUomConversionFormData = z.infer<typeof createInventoryItemUomConversionSchema>;
export type UpdateInventoryItemUomConversionFormData = z.infer<typeof updateInventoryItemUomConversionSchema>;
