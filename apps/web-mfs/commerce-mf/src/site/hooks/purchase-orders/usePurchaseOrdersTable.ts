import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrdersTableResponse } from '@/schemas/purchase-orders';
import { getPurchaseOrdersTable } from '@/site/services/purchase-orders.service';
import { PURCHASE_ORDERS_TABLE_KEY } from './keys';

// Fetches purchase orders table data
export function usePurchaseOrdersTable(
  options?: Omit<UseQueryOptions<PurchaseOrdersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PurchaseOrdersTableResponse, AxiosError>({
    queryKey: [...PURCHASE_ORDERS_TABLE_KEY],
    queryFn: getPurchaseOrdersTable,
    ...options,
  });
}
