import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setTaxComponentActive } from '@/services/organization/tax-components.service';

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
      invalidateWrites(queryClient, [Tables.taxComponents]);
      options?.onSuccess?.(...args);
    },
  });
}
