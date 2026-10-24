import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateDimensionFromTemplateData, OfferingDimensionData } from '@/schemas/offerings';
import { createDimensionFromTemplate } from '@/services/organization/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useCreateDimensionFromTemplate(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionFromTemplateData>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionFromTemplateData>({
    ...options,
    mutationFn: createDimensionFromTemplate,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
