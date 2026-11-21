import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AttributeTemplateData, CreateAttributeTemplateData } from '@/schemas/attribute-templates';
import { createAttributeTemplate } from '@/services/organization/attribute-templates.service';

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
      invalidateWrites(queryClient, [Tables.attributeTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
