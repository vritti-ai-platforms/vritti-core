import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateUomData } from '@/schemas/uom';
import { updateUom } from '@/services/organization/uom.service';

// Updates a UOM and invalidates the UOM table
export function useUpdateUom(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateUomData }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateUomData }>({
    ...options,
    mutationFn: updateUom,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.uom]);
      options?.onSuccess?.(...args);
    },
  });
}
