import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateStorageTypePayload, StorageTypeData } from '@/schemas/storage-types';
import { createStorageType } from '@/services/organization/storage-types.service';
import { STORAGE_TYPES_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: STORAGE_TYPES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
