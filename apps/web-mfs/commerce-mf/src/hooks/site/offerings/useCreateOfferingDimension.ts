import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateDimensionData, OfferingDimensionData } from '@/schemas/offerings';
import { createDimension } from '@/services/site/offerings.service';

export function useCreateOfferingDimension(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionData>({
    ...options,
    mutationFn: createDimension,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringDimensions]);
      options?.onSuccess?.(...args);
    },
  });
}
