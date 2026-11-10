import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { setTaxGroupActive } from '@/services/organization/tax-groups.service';
import { TAX_GROUP_KEY, TAX_GROUPS_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  isActive: boolean;
}

// Activates or deactivates a tax group and refreshes the table and the group
export function useSetTaxGroupActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: setTaxGroupActive,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_GROUP_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
