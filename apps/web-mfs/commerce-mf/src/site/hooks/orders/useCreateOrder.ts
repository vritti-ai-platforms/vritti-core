import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrderData } from '@/schemas/orders';
import { type CreateOrderPayload, createOrder } from '@/site/services/orders.service';
import { ORDERS_TABLE_KEY } from './keys';

export function useCreateOrder(
  options?: Omit<UseMutationOptions<OrderData, AxiosError, CreateOrderPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<OrderData, AxiosError, CreateOrderPayload>({
    ...options,
    mutationFn: createOrder,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
