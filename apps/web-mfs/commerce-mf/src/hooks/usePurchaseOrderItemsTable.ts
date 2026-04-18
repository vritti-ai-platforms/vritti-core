import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrderItemsTableResponse } from '@/schemas/purchase-orders';
import { getPurchaseOrderItemsTable } from '@/services/purchase-orders.service';

export const PURCHASE_ORDER_ITEMS_TABLE_KEY = (id: string) =>
  ['commerce', 'purchase-orders', id, 'items', 'table'] as const;

export function usePurchaseOrderItemsTable(
  id: string | null,
  options?: Omit<UseQueryOptions<PurchaseOrderItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PurchaseOrderItemsTableResponse, AxiosError>({
    queryKey: PURCHASE_ORDER_ITEMS_TABLE_KEY(id ?? ''),
    queryFn: () => getPurchaseOrderItemsTable(id as string),
    enabled: !!id,
    ...options,
  });
}
