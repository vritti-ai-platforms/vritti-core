import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';

export interface InventoryItemUomConversionData {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomName: string;
  uomSymbol: string;
  primaryUomQty: number;
  uomQty: number;
  // Derived: 1 UOM unit = toPrimaryConversionFactor primary units.
  toPrimaryConversionFactor: number;
  // Derived: 1 primary unit = toUomConversionFactor UOM units.
  toUomConversionFactor: number;
  canEdit: boolean;
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
