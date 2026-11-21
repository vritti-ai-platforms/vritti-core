import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateDimensionTemplateData } from '@/schemas/dimension-templates';
import { updateDimensionTemplate } from '@/services/site/dimension-templates.service';

type Vars = { id: string; data: UpdateDimensionTemplateData };

// Updates a dimension template and invalidates template queries
export function useUpdateDimensionTemplate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateDimensionTemplate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.dimensionTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
