import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseProgressSummary } from '@/schemas/purchases';
import { getPurchaseProgress } from '@/services/site/purchases.service';
import { PURCHASE_PROGRESS_KEY } from './keys';

// Fetches how far a purchase's items have got and where it stands as a whole
export function usePurchaseProgress(id: string) {
  return useQuery<PurchaseProgressSummary, AxiosError>({
    queryKey: PURCHASE_PROGRESS_KEY(id),
    queryFn: () => getPurchaseProgress(id),
  });
}
