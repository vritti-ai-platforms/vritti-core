import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AttributeTemplateData, CreateAttributeTemplateData } from '@/schemas/attribute-templates';
import { createAttributeTemplate } from '@/services/site/attribute-templates.service';
import { ATTRIBUTE_TEMPLATES_KEY } from './keys';

// Creates an attribute template and invalidates template queries
export function useCreateAttributeTemplate(
  options?: Omit<
    UseMutationOptions<CreateResponse<AttributeTemplateData>, AxiosError, CreateAttributeTemplateData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<AttributeTemplateData>, AxiosError, CreateAttributeTemplateData>({
    ...options,
    mutationFn: createAttributeTemplate,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_TEMPLATES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
