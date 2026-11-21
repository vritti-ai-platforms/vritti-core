import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteOffering } from '@/services/organization/offerings.service';

export function useDeleteOffering(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteOffering,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.offerings,
        Tables.offeringDimensions,
        Tables.offeringDimensionValues,
        Tables.offeringAttributes,
        Tables.offeringAttributeValues,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
