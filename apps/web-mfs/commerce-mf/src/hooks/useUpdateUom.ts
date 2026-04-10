import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomData } from '@/schemas/uom';
import { type UpdateUomPayload, updateUom } from '@/services/uom.service';
import { UOM_TABLE_KEY } from './useUom';

// Updates a UOM and invalidates the UOM list
export function useUpdateUom(
  options?: Omit<UseMutationOptions<UomData, AxiosError, { id: string; data: UpdateUomPayload }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<UomData, AxiosError, { id: string; data: UpdateUomPayload }>({
    ...options,
    mutationFn: updateUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
