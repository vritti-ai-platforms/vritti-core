import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteDimension } from '@/services/organization/offerings.service';

export function useDeleteOfferingDimension(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteDimension,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringDimensions, Tables.offeringDimensionValues]);
      options?.onSuccess?.(...args);
    },
  });
}
