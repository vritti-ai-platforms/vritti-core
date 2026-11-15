import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseItem } from '@/schemas/purchases';
import { getPurchaseItems } from '@/services/legal-entity/purchases.service';
import { PURCHASE_ITEMS_KEY } from './keys';

// Fetches a purchase's requested items for its Requesting view
export function usePurchaseItems(id: string) {
  return useSuspenseQuery<PurchaseItem[], AxiosError>({
    queryKey: PURCHASE_ITEMS_KEY(id),
    queryFn: () => getPurchaseItems(id),
  });
}
