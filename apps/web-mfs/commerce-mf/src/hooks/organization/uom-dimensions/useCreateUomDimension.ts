import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateUomDimensionData, UomDimensionData } from '@/schemas/uom-dimensions';
import { createUomDimension } from '@/services/organization/uom-dimensions.service';

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
      invalidateWrites(queryClient, [Tables.uomDimensions]);
      options?.onSuccess?.(...args);
    },
  });
}
