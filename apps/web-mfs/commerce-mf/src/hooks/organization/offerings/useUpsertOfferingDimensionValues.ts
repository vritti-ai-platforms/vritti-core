import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpsertDimensionValuesData } from '@/schemas/offerings';
import { upsertDimensionValues } from '@/services/organization/offerings.service';

export function useUpsertOfferingDimensionValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertDimensionValuesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpsertDimensionValuesData>({
    ...options,
    mutationFn: upsertDimensionValues,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringDimensionValues, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
