import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { OrderStatus } from '@/schemas/orders';
import { updateOrderStatus } from '@/services/orders.service';
import { ORDERS_TABLE_KEY } from './useOrdersTable';

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
      queryClient.invalidateQueries({ queryKey: ['commerce', 'orders', variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
