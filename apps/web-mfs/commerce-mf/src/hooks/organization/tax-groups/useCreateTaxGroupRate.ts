import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { TaxGroupRateData, TaxGroupRatePayload } from '@/schemas/tax-groups';
import { createTaxGroupRate } from '@/services/organization/tax-groups.service';

interface Vars {
  taxGroupId: string;
  data: TaxGroupRatePayload;
}

// Adds a rate to a tax group and refreshes the group and its rates
export function useCreateTaxGroupRate(
  options?: Omit<UseMutationOptions<CreateResponse<TaxGroupRateData>, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<TaxGroupRateData>, AxiosError, Vars>({
    ...options,
    mutationFn: createTaxGroupRate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxGroupRates]);
      options?.onSuccess?.(...args);
    },
  });
}
