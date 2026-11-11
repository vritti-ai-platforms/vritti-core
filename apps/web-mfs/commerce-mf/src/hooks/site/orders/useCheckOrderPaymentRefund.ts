import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { checkOrderPaymentRefund } from '@/services/site/orders.service';
import { ORDER_PAYMENTS_KEY } from './keys';

type CheckVariables = { id: string; paymentIntentId: string };

export function useCheckOrderPaymentRefund(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, CheckVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, CheckVariables>({
    ...options,
    mutationFn: checkOrderPaymentRefund,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: ORDER_PAYMENTS_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
