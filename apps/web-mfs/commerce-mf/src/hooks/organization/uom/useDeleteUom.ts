import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteUom } from '@/services/organization/uom.service';

// Deletes a UOM and invalidates the UOM table
export function useDeleteUom(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteUom,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.uom]);
      options?.onSuccess?.(...args);
    },
  });
}
