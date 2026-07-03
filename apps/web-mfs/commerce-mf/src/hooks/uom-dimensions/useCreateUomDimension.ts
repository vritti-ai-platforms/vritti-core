import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateUomDimensionData, UomDimensionData } from '@/schemas/uom-dimensions';
import { createUomDimension } from '@/services/uom-dimensions.service';
import { UOM_DIMENSIONS_KEY } from './keys';

export function useCreateUomDimension(
  options?: Omit<
    UseMutationOptions<CreateResponse<UomDimensionData>, AxiosError, CreateUomDimensionData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<UomDimensionData>, AxiosError, CreateUomDimensionData>({
    ...options,
    mutationFn: createUomDimension,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: UOM_DIMENSIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
