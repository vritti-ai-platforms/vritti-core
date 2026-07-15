import { z, zodCurrencyField } from '@vritti/quantum-ui/zod';

export interface InventoryItemMrpData {
  id: string;
  inventoryItemId: string;
  amount: { currency: string; value: string };
  sourceLotId: string | null;
  sourcedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const upsertInventoryItemMrpSchema = z.object({
  amount: zodCurrencyField({ positive: true }),
  sourceLotId: z.string().uuid().nullable().optional(),
});

export type UpsertInventoryItemMrpFormData = z.infer<typeof upsertInventoryItemMrpSchema>;
