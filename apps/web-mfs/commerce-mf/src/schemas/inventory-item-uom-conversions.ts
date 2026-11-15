import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField } from '@vritti/quantum-ui/zod';
import { type MeasureFigures, measureFiguresSchema } from './measures';

export interface InventoryItemUomConversionData extends MeasureFigures {
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

export const updateInventoryItemUomConversionSchema = measureFiguresSchema.extend({
  primaryUomQty: positiveInt,
  uomQty: positiveInt,
});

export const createInventoryItemUomConversionSchema = updateInventoryItemUomConversionSchema.extend({
  uomId: z.uuid('UOM is required'),
});

export type CreateInventoryItemUomConversionFormData = z.infer<typeof createInventoryItemUomConversionSchema>;
export type UpdateInventoryItemUomConversionFormData = z.infer<typeof updateInventoryItemUomConversionSchema>;

export type UpdateInventoryItemUomConversionPayload = UpdateInventoryItemUomConversionFormData & {
  conversionId: string;
};
