import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteAttributeTemplate } from '@/services/legal-entity/attribute-templates.service';
import { ATTRIBUTE_TEMPLATES_KEY } from './keys';

// Deletes an attribute template and invalidates template queries
export function useDeleteAttributeTemplate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteAttributeTemplate,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_TEMPLATES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
