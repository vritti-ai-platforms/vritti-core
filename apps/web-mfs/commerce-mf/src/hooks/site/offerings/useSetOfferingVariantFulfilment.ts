import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SetVariantFulfilmentData } from '@/schemas/offerings';
import { setVariantFulfilment } from '@/services/site/offerings.service';

export function useSetOfferingVariantFulfilment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetVariantFulfilmentData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetVariantFulfilmentData>({
    ...options,
    mutationFn: setVariantFulfilment,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
