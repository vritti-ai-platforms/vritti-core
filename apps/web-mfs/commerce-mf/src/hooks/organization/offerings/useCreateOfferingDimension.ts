import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateDimensionData, OfferingDimensionData } from '@/schemas/offerings';
import { createDimension } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useCreateOfferingDimension(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionData>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionData>({
    ...options,
    mutationFn: createDimension,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
