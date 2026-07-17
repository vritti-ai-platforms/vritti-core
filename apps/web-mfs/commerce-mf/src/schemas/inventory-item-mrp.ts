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

export const upsertInventoryItemMrpSchema = z.object({
  uomId: z.string().uuid('Unit is required'),
  amount: zodCurrencyField({ positive: true }),
  sourceLotId: z.string().uuid().nullable().optional(),
});

export type UpsertInventoryItemMrpFormData = z.infer<typeof upsertInventoryItemMrpSchema>;
