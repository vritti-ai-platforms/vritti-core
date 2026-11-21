import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateStorageTypePayload, StorageTypeData } from '@/schemas/storage-types';
import { createStorageType } from '@/services/organization/storage-types.service';

// Creates a storage type and refreshes the table and the pickers
export function useCreateStorageType(
  options?: Omit<
    UseMutationOptions<CreateResponse<StorageTypeData>, AxiosError, CreateStorageTypePayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<StorageTypeData>, AxiosError, CreateStorageTypePayload>({
    ...options,
    mutationFn: createStorageType,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.storageTypes]);
      options?.onSuccess?.(...args);
    },
  });
}
