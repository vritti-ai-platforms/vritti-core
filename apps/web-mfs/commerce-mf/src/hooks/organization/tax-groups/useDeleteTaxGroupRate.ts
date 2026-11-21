import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteTaxGroupRate } from '@/services/organization/tax-groups.service';

interface Vars {
  taxGroupId: string;
  rateId: string;
}

// Deletes a tax group's rate and refreshes the group and its rates
export function useDeleteTaxGroupRate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: deleteTaxGroupRate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxGroupRates]);
      options?.onSuccess?.(...args);
    },
  });
}
