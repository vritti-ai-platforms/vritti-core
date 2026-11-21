import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { GenerateVariantsData } from '@/schemas/offerings';
import { generateVariants } from '@/services/legal-entity/offerings.service';

export function useGenerateOfferingVariants(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, GenerateVariantsData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, GenerateVariantsData>({
    ...options,
    mutationFn: generateVariants,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariants, Tables.offeringVariantValues]);
      options?.onSuccess?.(...args);
    },
  });
}
