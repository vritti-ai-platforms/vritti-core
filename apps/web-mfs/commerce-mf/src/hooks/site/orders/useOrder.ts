import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrderDetail } from '@/schemas/orders';
import { getOrder } from '@/services/site/orders.service';
import { ORDER_KEY } from './keys';

// Fetches an order with its items by ID
export function useOrder(id: string) {
  return useSuspenseQuery<OrderDetail, AxiosError>({
    queryKey: ORDER_KEY(id),
    queryFn: () => getOrder(id),
  });
}
