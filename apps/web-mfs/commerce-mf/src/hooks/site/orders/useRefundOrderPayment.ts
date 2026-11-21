import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { refundOrderPayment } from '@/services/site/orders.service';

type RefundVariables = { id: string; paymentIntentId: string };

export function useRefundOrderPayment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, RefundVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, RefundVariables>({
    ...options,
    mutationFn: refundOrderPayment,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.externalPaymentsPaymentIntents]);
      options?.onSuccess?.(...args);
    },
  });
}
