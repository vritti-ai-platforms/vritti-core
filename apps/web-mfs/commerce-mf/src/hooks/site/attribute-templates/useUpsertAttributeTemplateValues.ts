import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpsertAttributeTemplateValuesData } from '@/schemas/attribute-templates';
import { upsertAttributeTemplateValues } from '@/services/site/attribute-templates.service';

// Replaces a template's values and invalidates template queries
export function useUpsertAttributeTemplateValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertAttributeTemplateValuesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpsertAttributeTemplateValuesData>({
    ...options,
    mutationFn: upsertAttributeTemplateValues,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.attributeTemplateValues, Tables.attributeTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
