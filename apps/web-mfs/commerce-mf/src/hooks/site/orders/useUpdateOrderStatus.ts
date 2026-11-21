import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { OrderStatus } from '@/schemas/orders';
import { updateOrderStatus } from '@/services/site/orders.service';

export function useUpdateOrderStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; status: OrderStatus }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; status: OrderStatus }>({
    ...options,
    mutationFn: updateOrderStatus,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.orders]);
      options?.onSuccess?.(...args);
    },
  });
}
