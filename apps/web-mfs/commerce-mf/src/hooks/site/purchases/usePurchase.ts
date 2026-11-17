import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseDetail } from '@/schemas/purchases';
import { getPurchase } from '@/services/site/purchases.service';
import { PURCHASE_KEY } from './keys';

// Fetches one purchase with its site
export function usePurchase(id: string) {
  return useSuspenseQuery<PurchaseDetail, AxiosError>({
    queryKey: PURCHASE_KEY(id),
    queryFn: () => getPurchase(id),
  });
}
