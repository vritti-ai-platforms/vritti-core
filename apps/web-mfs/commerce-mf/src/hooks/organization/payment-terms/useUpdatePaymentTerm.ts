import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePaymentTermPayload } from '@/schemas/payment-terms';
import { updatePaymentTerm } from '@/services/organization/payment-terms.service';

interface Vars {
  id: string;
  data: UpdatePaymentTermPayload;
}

export function useUpdatePaymentTerm(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updatePaymentTerm,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.paymentTerms]);
      options?.onSuccess?.(...args);
    },
  });
}
