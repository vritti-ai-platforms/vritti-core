import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { setTaxClassActive } from '@/services/organization/tax-classes.service';
import { TAX_CLASS_KEY, TAX_CLASSES_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  isActive: boolean;
}

// Activates or deactivates a tax class and refreshes the table and the class
export function useSetTaxClassActive(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: setTaxClassActive,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_CLASS_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
