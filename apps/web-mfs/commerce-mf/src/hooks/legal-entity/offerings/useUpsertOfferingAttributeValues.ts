import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpsertAttributeValuesData } from '@/schemas/offerings';
import { upsertAttributeValues } from '@/services/legal-entity/offerings.service';

export function useUpsertOfferingAttributeValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertAttributeValuesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpsertAttributeValuesData>({
    ...options,
    mutationFn: upsertAttributeValues,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringAttributeValues, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
