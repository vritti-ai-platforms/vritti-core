import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateDimensionTemplateData } from '@/schemas/dimension-templates';
import { updateDimensionTemplate } from '@/services/legal-entity/dimension-templates.service';
import { DIMENSION_TEMPLATES_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: DIMENSION_TEMPLATES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
