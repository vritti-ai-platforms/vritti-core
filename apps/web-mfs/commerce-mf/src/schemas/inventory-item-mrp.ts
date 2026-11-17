import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField } from '@vritti/quantum-ui/zod';

export interface InventoryItemMrpData {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomSymbol: string;
  amount: CurrencyValue;
  sourceLotId: string | null;
  sourcedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemMrpTableResponse = TableResponse<InventoryItemMrpData>;

export const addInventoryItemMrpSchema = z.object({
  uomId: z.uuid('Unit is required'),
  amount: zodCurrencyField({ positive: true }),
});

export type AddInventoryItemMrpFormData = z.infer<typeof addInventoryItemMrpSchema>;

export const updateInventoryItemMrpSchema = z.object({
  amount: zodCurrencyField({ positive: true }),
});

export type UpdateInventoryItemMrpFormData = z.infer<typeof updateInventoryItemMrpSchema>;
