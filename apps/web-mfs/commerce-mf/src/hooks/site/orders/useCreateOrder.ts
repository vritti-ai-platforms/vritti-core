import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { OrderData } from '@/schemas/orders';
import { type CreateOrderPayload, createOrder } from '@/services/site/orders.service';

export function useCreateOrder(
  options?: Omit<UseMutationOptions<OrderData, AxiosError, CreateOrderPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<OrderData, AxiosError, CreateOrderPayload>({
    ...options,
    mutationFn: createOrder,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.orders, Tables.orderItems]);
      options?.onSuccess?.(...args);
    },
  });
}
