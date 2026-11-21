import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteAttributeTemplate } from '@/services/organization/attribute-templates.service';

// Deletes an attribute template and invalidates template queries
export function useDeleteAttributeTemplate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteAttributeTemplate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.attributeTemplates, Tables.attributeTemplateValues]);
      options?.onSuccess?.(...args);
    },
  });
}
