import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { OrderStatus } from '@/schemas/orders';
import { updateOrderStatus } from '@/services/site/orders.service';
import { ORDER_KEY, ORDERS_TABLE_KEY } from './keys';

export function useUpdateOrderStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; status: OrderStatus }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; status: OrderStatus }>({
    ...options,
    mutationFn: updateOrderStatus,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ORDER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
