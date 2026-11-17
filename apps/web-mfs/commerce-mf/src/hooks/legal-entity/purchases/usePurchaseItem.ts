import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseItemView } from '@/schemas/purchases';
import { getPurchaseItem } from '@/services/legal-entity/purchases.service';
import { PURCHASE_ITEM_KEY } from './keys';

// Fetches one purchase item as its own page shows it
export function usePurchaseItem(id: string, itemId: string) {
  return useSuspenseQuery<PurchaseItemView, AxiosError>({
    queryKey: PURCHASE_ITEM_KEY(id, itemId),
    queryFn: () => getPurchaseItem(id, itemId),
  });
}
