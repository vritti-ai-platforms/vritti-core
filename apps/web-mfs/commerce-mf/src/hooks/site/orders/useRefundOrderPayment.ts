import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { refundOrderPayment } from '@/services/site/orders.service';
import { ORDER_PAYMENTS_KEY } from './keys';

type RefundVariables = { id: string; paymentIntentId: string };

export function useRefundOrderPayment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, RefundVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, RefundVariables>({
    ...options,
    mutationFn: refundOrderPayment,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: ORDER_PAYMENTS_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
