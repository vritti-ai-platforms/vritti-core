import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateDimensionTemplateData, DimensionTemplateData } from '@/schemas/dimension-templates';
import { createDimensionTemplate } from '@/services/organization/dimension-templates.service';
import { DIMENSION_TEMPLATES_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: DIMENSION_TEMPLATES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
