import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrderDetail } from '@/schemas/orders';
import { getOrder } from '@/services/orders.service';

export function useOrder(
  id: string | null,
  options?: Omit<UseQueryOptions<OrderDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<OrderDetail, AxiosError>({
    queryKey: ['commerce', 'orders', id],
    queryFn: () => getOrder(id as string),
    enabled: !!id,
    ...options,
  });
}
