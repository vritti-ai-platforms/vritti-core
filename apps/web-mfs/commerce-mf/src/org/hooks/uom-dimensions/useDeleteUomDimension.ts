import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteUomDimension } from '@/org/services/uom-dimensions.service';
import { UOM_DIMENSIONS_KEY } from './keys';

export function useDeleteUomDimension(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteUomDimension,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_DIMENSIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
