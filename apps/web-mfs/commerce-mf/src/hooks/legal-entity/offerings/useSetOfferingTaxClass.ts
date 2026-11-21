import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SetOfferingTaxClassData } from '@/schemas/offerings';
import { setOfferingTaxClass } from '@/services/legal-entity/offerings.service';

export function useSetOfferingTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetOfferingTaxClassData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetOfferingTaxClassData>({
    ...options,
    mutationFn: setOfferingTaxClass,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offerings, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
