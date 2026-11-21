import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateAttributeTemplateData } from '@/schemas/attribute-templates';
import { updateAttributeTemplate } from '@/services/legal-entity/attribute-templates.service';

type Vars = { id: string; data: UpdateAttributeTemplateData };

// Updates an attribute template and invalidates template queries
export function useUpdateAttributeTemplate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateAttributeTemplate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.attributeTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
