import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getPurchaseOrderItemIds } from '@/services/purchase-orders.service';

export const PURCHASE_ORDER_ITEMS_IDS_KEY = (id: string) =>
  ['commerce', 'purchase-orders', id, 'items', 'ids'] as const;

export function usePurchaseOrderItemsIds(
  id: string | null,
  options?: Omit<UseQueryOptions<string[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<string[], AxiosError>({
    queryKey: PURCHASE_ORDER_ITEMS_IDS_KEY(id ?? ''),
    queryFn: () => getPurchaseOrderItemIds(id as string),
    enabled: !!id,
    ...options,
  });
}
