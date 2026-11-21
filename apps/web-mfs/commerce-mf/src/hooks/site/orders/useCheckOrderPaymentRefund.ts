import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { checkOrderPaymentRefund } from '@/services/site/orders.service';

type CheckVariables = { id: string; paymentIntentId: string };

export function useCheckOrderPaymentRefund(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, CheckVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, CheckVariables>({
    ...options,
    mutationFn: checkOrderPaymentRefund,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.externalPaymentsPaymentIntents]);
      options?.onSuccess?.(...args);
    },
  });
}
