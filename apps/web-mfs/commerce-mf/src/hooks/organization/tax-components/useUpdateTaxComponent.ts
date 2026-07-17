import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type UpdateTaxComponentPayload, updateTaxComponent } from '@/services/organization/tax-components.service';
import { TAX_COMPONENT_KEY, TAX_COMPONENTS_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdateTaxComponentPayload;
}

export function useUpdateTaxComponent(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxComponent,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_COMPONENTS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_COMPONENT_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
