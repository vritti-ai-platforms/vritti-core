import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { deleteBom } from '@/services/bom.service';
import { BOM_TABLE_KEY } from './useBomTable';

// Deletes a BOM and invalidates the table
export function useDeleteBom(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteBom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: BOM_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
