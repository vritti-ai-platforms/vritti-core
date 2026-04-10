import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrdersTableResponse } from '@/schemas/orders';
import { getOrdersTable } from '@/services/orders.service';

export const ORDERS_TABLE_KEY = ['commerce', 'orders', 'table'] as const;

export function useOrdersTable(
  options?: Omit<UseQueryOptions<OrdersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<OrdersTableResponse, AxiosError>({
    queryKey: [...ORDERS_TABLE_KEY],
    queryFn: getOrdersTable,
    ...options,
  });
}
