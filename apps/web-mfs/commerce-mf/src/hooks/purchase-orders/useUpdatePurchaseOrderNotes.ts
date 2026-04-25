import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { updatePurchaseOrderNotes } from '@/services/purchase-orders.service';
import { PURCHASE_ORDERS_TABLE_KEY, PURCHASE_ORDER_KEY } from './keys';

export function useUpdatePurchaseOrderNotes(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; notes?: string | null }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; notes?: string | null }>({
    ...options,
    mutationFn: updatePurchaseOrderNotes,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
