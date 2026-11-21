import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setAttributeTemplateActive } from '@/services/site/attribute-templates.service';

type Vars = { id: string; isActive: boolean };

// Activates or deactivates an attribute template and invalidates template queries
export function useSetAttributeTemplateActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: setAttributeTemplateActive,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.attributeTemplates]);
      options?.onSuccess?.(...args);
    },
  });
}
