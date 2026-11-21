import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrderCounts } from '@/schemas/orders';
import { getOrderCounts } from '@/services/site/orders.service';
import { ORDER_COUNTS_KEY } from './keys';

// Fetches how many items and payments an order has, one per tab; under the order's key, so its refreshes reach them
export function useOrderCounts(id: string) {
  return useQuery<OrderCounts, AxiosError>({
    queryKey: ORDER_COUNTS_KEY(id),
    queryFn: () => getOrderCounts(id),
  });
}
