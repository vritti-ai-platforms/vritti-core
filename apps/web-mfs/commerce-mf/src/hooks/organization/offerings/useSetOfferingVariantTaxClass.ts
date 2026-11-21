import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SetVariantTaxClassData } from '@/schemas/offerings';
import { setVariantTaxClass } from '@/services/organization/offerings.service';

export function useSetOfferingVariantTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetVariantTaxClassData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetVariantTaxClassData>({
    ...options,
    mutationFn: setVariantTaxClass,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
