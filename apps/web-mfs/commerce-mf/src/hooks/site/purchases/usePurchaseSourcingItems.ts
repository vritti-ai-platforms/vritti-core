import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseSourcingItem } from '@/schemas/purchases';
import { getPurchaseSourcingItems } from '@/services/site/purchases.service';
import { PURCHASE_SOURCING_ITEMS_KEY } from './keys';

// Fetches a purchase's items with their allocations for the Items tab of its Sourcing view
export function usePurchaseSourcingItems(id: string) {
  return useSuspenseQuery<PurchaseSourcingItem[], AxiosError>({
    queryKey: PURCHASE_SOURCING_ITEMS_KEY(id),
    queryFn: () => getPurchaseSourcingItems(id),
  });
}
