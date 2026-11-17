import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseActions } from '@/schemas/purchases';
import { getPurchaseActions } from '@/services/site/purchases.service';
import { PURCHASE_ACTIONS_KEY } from './keys';

// Fetches the actions a purchase offers and why the others are blocked
export function usePurchaseActions(id: string) {
  return useQuery<PurchaseActions, AxiosError>({
    queryKey: PURCHASE_ACTIONS_KEY(id),
    queryFn: () => getPurchaseActions(id),
  });
}
