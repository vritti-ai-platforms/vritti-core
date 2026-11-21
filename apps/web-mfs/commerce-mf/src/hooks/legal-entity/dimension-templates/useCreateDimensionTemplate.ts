import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateDimensionTemplateData, DimensionTemplateData } from '@/schemas/dimension-templates';
import { createDimensionTemplate } from '@/services/legal-entity/dimension-templates.service';

// Creates a dimension template and invalidates template queries
export function useCreateDimensionTemplate(
  options?: Omit<
    UseMutationOptions<CreateResponse<DimensionTemplateData>, AxiosError, CreateDimensionTemplateData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<DimensionTemplateData>, AxiosError, CreateDimensionTemplateData>({
    ...options,
    mutationFn: createDimensionTemplate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.dimensionTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
