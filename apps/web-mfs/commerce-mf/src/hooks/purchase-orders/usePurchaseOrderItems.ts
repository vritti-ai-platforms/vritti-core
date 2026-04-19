import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrderItemData } from '@/schemas/purchase-orders';
import { getPurchaseOrderItems } from '@/services/purchase-orders.service';

export const PURCHASE_ORDER_ITEMS_KEY = (id: string) => ['commerce', 'purchase-orders', id, 'items'] as const;

export function usePurchaseOrderItems(
  id: string | null,
  options?: Omit<UseQueryOptions<PurchaseOrderItemData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PurchaseOrderItemData[], AxiosError>({
    queryKey: PURCHASE_ORDER_ITEMS_KEY(id ?? ''),
    queryFn: () => getPurchaseOrderItems(id as string),
    enabled: !!id,
    ...options,
  });
}
