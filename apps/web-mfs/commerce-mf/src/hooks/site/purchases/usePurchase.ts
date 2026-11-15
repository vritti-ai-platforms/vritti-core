import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseHeader } from '@/schemas/purchases';
import { getPurchase } from '@/services/site/purchases.service';
import { PURCHASE_KEY } from './keys';

// Fetches a purchase's header: its stage, counts, progress and purchase-level actions
export function usePurchase(id: string) {
  return useSuspenseQuery<PurchaseHeader, AxiosError>({
    queryKey: PURCHASE_KEY(id),
    queryFn: () => getPurchase(id),
  });
}
