import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setDimensionTemplateActive } from '@/services/legal-entity/dimension-templates.service';

type Vars = { id: string; isActive: boolean };

// Activates or deactivates a dimension template and invalidates template queries
export function useSetDimensionTemplateActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: setDimensionTemplateActive,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.dimensionTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
