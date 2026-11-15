import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteStorageType } from '@/services/organization/storage-types.service';
import { STORAGE_TYPES_KEY } from './keys';

// Deletes a storage type and refreshes the table
export function useDeleteStorageType(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteStorageType,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STORAGE_TYPES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
