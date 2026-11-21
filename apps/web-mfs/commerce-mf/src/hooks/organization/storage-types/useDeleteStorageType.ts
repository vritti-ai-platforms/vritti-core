import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteStorageType } from '@/services/organization/storage-types.service';

// Deletes a storage type and refreshes the table
export function useDeleteStorageType(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteStorageType,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.storageTypes]);
      options?.onSuccess?.(...args);
    },
  });
}
