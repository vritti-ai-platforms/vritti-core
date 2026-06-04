import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { UpdateUomData } from '@/schemas/uom';
import { updateUom } from '@/services/uom.service';
import { UOM_TABLE_KEY } from './keys';

// Updates a UOM and invalidates the UOM table
export function useUpdateUom(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateUomData }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateUomData }>({
    ...options,
    mutationFn: updateUom,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
