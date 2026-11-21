import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { TaxGroupRatePayload } from '@/schemas/tax-groups';
import { updateTaxGroupRate } from '@/services/organization/tax-groups.service';

interface Vars {
  taxGroupId: string;
  rateId: string;
  data: TaxGroupRatePayload;
}

// Updates a tax group's rate and refreshes the group and its rates
export function useUpdateTaxGroupRate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxGroupRate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxGroupRates]);
      options?.onSuccess?.(...args);
    },
  });
}
