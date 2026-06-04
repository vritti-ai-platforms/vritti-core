import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteUom } from '@/services/uom.service';
import { UOM_DIMENSIONS_KEY } from '../uom-dimensions/keys';
import { UOM_TABLE_KEY } from './keys';

// Deletes a UOM and invalidates the UOM table
export function useDeleteUom(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: UOM_DIMENSIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
