import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { type UpdateUomPayload, updateUom } from '@/services/uom.service';
import { UOM_BASE_KEY, UOM_DERIVED_KEY } from './useUom';

// Updates a UOM and invalidates the UOM lists
export function useUpdateUom(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateUomPayload }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateUomPayload }>({
    ...options,
    mutationFn: updateUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_BASE_KEY });
      queryClient.invalidateQueries({ queryKey: UOM_DERIVED_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
