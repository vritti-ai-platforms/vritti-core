import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrderDetail } from '@/schemas/orders';
import { getOrder } from '@/site/services/orders.service';
import { ORDER_KEY } from './keys';

export function useOrder(
  id: string | null,
  options?: Omit<UseQueryOptions<OrderDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<OrderDetail, AxiosError>({
    queryKey: ORDER_KEY(id ?? ''),
    queryFn: () => getOrder(id as string),
    enabled: !!id,
    ...options,
  });
}
