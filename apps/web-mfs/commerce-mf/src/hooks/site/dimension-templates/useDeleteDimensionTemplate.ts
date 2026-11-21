import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteDimensionTemplate } from '@/services/site/dimension-templates.service';

// Deletes a dimension template and invalidates template queries
export function useDeleteDimensionTemplate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteDimensionTemplate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.dimensionTemplates, Tables.dimensionTemplateValues]);
      options?.onSuccess?.(...args);
    },
  });
}
