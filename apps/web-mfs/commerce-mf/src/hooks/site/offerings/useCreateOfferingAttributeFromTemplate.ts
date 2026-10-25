import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateAttributeFromTemplateData, OfferingAttributeData } from '@/schemas/offerings';
import { createAttributeFromTemplate } from '@/services/site/offerings.service';
import { useInvalidate } from './useInvalidate';

export function useCreateOfferingAttributeFromTemplate(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeFromTemplateData>,
    'mutationFn'
  >,
) {
  const invalidate = useInvalidate();
  return useMutation<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeFromTemplateData>({
    ...options,
    mutationFn: createAttributeFromTemplate,
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
