import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpsertDimensionTemplateValuesData } from '@/schemas/dimension-templates';
import { upsertDimensionTemplateValues } from '@/services/organization/dimension-templates.service';

// Replaces a template's values and invalidates template queries
export function useUpsertDimensionTemplateValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertDimensionTemplateValuesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpsertDimensionTemplateValuesData>({
    ...options,
    mutationFn: upsertDimensionTemplateValues,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.dimensionTemplateValues, Tables.dimensionTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
