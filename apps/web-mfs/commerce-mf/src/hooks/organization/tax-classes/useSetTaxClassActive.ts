import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setTaxClassActive } from '@/services/organization/tax-classes.service';

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
      invalidateWrites(queryClient, [Tables.taxClasses]);
      options?.onSuccess?.(...args);
    },
  });
}
