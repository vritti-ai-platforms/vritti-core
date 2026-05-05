import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from 'zod';

export interface InventoryItemUomConversionData {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomName: string;
  uomSymbol: string;
  baseUomId: string | null;
  baseUomSymbol: string | null;
  defaultConversionFactor: number;
  conversionFactor: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemUomConversionsTableResponse = TableResponse<InventoryItemUomConversionData>;

export const createInventoryItemUomConversionSchema = z.object({
  uomId: z.string().uuid('UOM is required'),
  conversionFactor: z.coerce.number<number>().min(0.0000001, 'Must be greater than 0'),
});

export const updateInventoryItemUomConversionSchema = z.object({
  conversionFactor: z.coerce.number<number>().min(0.0000001, 'Must be greater than 0'),
});

export type CreateInventoryItemUomConversionFormData = z.infer<typeof createInventoryItemUomConversionSchema>;
export type UpdateInventoryItemUomConversionFormData = z.infer<typeof updateInventoryItemUomConversionSchema>;
