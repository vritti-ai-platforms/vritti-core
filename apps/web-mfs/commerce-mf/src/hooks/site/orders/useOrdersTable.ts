import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrdersTableResponse } from '@/schemas/orders';
import { getOrdersTable } from '@/services/site/orders.service';
import { ORDERS_TABLE_KEY } from './keys';

export function useOrdersTable(
  options?: Omit<UseQueryOptions<OrdersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<OrdersTableResponse, AxiosError>({
    queryKey: ORDERS_TABLE_KEY,
    queryFn: getOrdersTable,
    ...options,
  });
}
