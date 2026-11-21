import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateVariantData, OfferingVariantData } from '@/schemas/offerings';
import { createVariant } from '@/services/legal-entity/offerings.service';

export function useCreateOfferingVariant(
  options?: Omit<UseMutationOptions<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<OfferingVariantData>, AxiosError, CreateVariantData>({
    ...options,
    mutationFn: createVariant,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariants, Tables.offeringVariantValues]);
      options?.onSuccess?.(...args);
    },
  });
}
