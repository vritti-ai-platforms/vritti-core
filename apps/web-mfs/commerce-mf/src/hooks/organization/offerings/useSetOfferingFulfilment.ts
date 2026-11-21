import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SetOfferingFulfilmentData } from '@/schemas/offerings';
import { setOfferingFulfilment } from '@/services/organization/offerings.service';

export function useSetOfferingFulfilment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetOfferingFulfilmentData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetOfferingFulfilmentData>({
    ...options,
    mutationFn: setOfferingFulfilment,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offerings, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
