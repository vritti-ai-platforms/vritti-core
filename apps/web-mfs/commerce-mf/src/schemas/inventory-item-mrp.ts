import { z, zodCurrencyField } from '@vritti/quantum-ui/zod';

export interface InventoryItemMrpData {
  id: string;
  inventoryItemId: string;
  uomId: string;
  uomSymbol: string | null;
  amount: { currency: string; value: string };
  sourceLotId: string | null;
  sourcedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const addInventoryItemMrpSchema = z.object({
  uomId: z.string().uuid('Unit is required'),
  amount: zodCurrencyField({ positive: true }),
});

export type AddInventoryItemMrpFormData = z.infer<typeof addInventoryItemMrpSchema>;

export const updateInventoryItemMrpSchema = z.object({
  amount: zodCurrencyField({ positive: true }),
});

export type UpdateInventoryItemMrpFormData = z.infer<typeof updateInventoryItemMrpSchema>;
