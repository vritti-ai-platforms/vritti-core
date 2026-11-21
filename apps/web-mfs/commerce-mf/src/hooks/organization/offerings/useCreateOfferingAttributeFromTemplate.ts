import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateAttributeFromTemplateData, OfferingAttributeData } from '@/schemas/offerings';
import { createAttributeFromTemplate } from '@/services/organization/offerings.service';

export function useCreateOfferingAttributeFromTemplate(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeFromTemplateData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeFromTemplateData>({
    ...options,
    mutationFn: createAttributeFromTemplate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringAttributes, Tables.offeringAttributeValues]);
      options?.onSuccess?.(...args);
    },
  });
}
