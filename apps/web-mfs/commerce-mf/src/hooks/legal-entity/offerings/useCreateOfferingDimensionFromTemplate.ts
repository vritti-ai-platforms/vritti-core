import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateDimensionFromTemplateData, OfferingDimensionData } from '@/schemas/offerings';
import { createDimensionFromTemplate } from '@/services/legal-entity/offerings.service';

export function useCreateOfferingDimensionFromTemplate(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionFromTemplateData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<OfferingDimensionData>, AxiosError, CreateDimensionFromTemplateData>({
    ...options,
    mutationFn: createDimensionFromTemplate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringDimensions, Tables.offeringDimensionValues]);
      options?.onSuccess?.(...args);
    },
  });
}
