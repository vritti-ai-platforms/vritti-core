import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { updateUomDimension } from '@/org/services/uom-dimensions.service';
import type { UpdateUomDimensionData } from '@/schemas/uom-dimensions';
import { UOM_DIMENSIONS_KEY } from './keys';

export function useUpdateUomDimension(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateUomDimensionData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateUomDimensionData }>({
    ...options,
    mutationFn: updateUomDimension,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_DIMENSIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
