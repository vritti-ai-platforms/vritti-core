import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseCounts } from '@/schemas/purchases';
import { getPurchaseCounts } from '@/services/legal-entity/purchases.service';
import { PURCHASE_COUNTS_KEY } from './keys';

// Fetches how many item lines, suppliers and requested quotations a purchase has
export function usePurchaseCounts(id: string) {
  return useQuery<PurchaseCounts, AxiosError>({
    queryKey: PURCHASE_COUNTS_KEY(id),
    queryFn: () => getPurchaseCounts(id),
  });
}
