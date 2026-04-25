import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { deleteUom } from '@/services/uom.service';
import { UOM_BASE_KEY, UOM_DERIVED_KEY } from './keys';

// Deletes a UOM and invalidates the UOM lists
export function useDeleteUom(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_BASE_KEY });
      queryClient.invalidateQueries({ queryKey: UOM_DERIVED_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
