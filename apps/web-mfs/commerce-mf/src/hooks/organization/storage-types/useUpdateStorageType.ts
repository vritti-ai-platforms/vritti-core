import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateStorageTypePayload } from '@/schemas/storage-types';
import { updateStorageType } from '@/services/organization/storage-types.service';
import { STORAGE_TYPES_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdateStorageTypePayload;
}

// Updates a storage type and refreshes the table
export function useUpdateStorageType(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateStorageType,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STORAGE_TYPES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
