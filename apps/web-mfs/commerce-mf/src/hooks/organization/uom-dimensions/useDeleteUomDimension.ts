import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteUomDimension } from '@/services/organization/uom-dimensions.service';

export function useDeleteUomDimension(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteUomDimension,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.uomDimensions, Tables.uom]);
      options?.onSuccess?.(...args);
    },
  });
}
