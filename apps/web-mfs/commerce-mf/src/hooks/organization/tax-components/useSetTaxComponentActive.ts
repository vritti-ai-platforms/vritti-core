import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { setTaxComponentActive } from '@/services/organization/tax-components.service';
import { TAX_COMPONENT_KEY, TAX_COMPONENTS_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  isActive: boolean;
}

// Activates or deactivates a tax component and refreshes the table and the component
export function useSetTaxComponentActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: setTaxComponentActive,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_COMPONENTS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_COMPONENT_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
