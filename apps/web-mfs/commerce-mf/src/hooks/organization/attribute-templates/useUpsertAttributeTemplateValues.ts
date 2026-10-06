import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpsertAttributeTemplateValuesData } from '@/schemas/attribute-templates';
import { upsertAttributeTemplateValues } from '@/services/organization/attribute-templates.service';
import { ATTRIBUTE_TEMPLATES_KEY } from './keys';

// Replaces a template's values and invalidates template queries
export function useUpsertAttributeTemplateValues(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpsertAttributeTemplateValuesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpsertAttributeTemplateValuesData>({
    ...options,
    mutationFn: upsertAttributeTemplateValues,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_TEMPLATES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
