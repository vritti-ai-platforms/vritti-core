import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { TaxJurisdictionCreateResponse, TaxJurisdictionPayload } from '@/schemas/tax-jurisdictions';
import { createTaxJurisdiction } from '@/services/organization/tax-jurisdictions.service';

export function useCreateTaxJurisdiction(
  options?: Omit<UseMutationOptions<TaxJurisdictionCreateResponse, AxiosError, TaxJurisdictionPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<TaxJurisdictionCreateResponse, AxiosError, TaxJurisdictionPayload>({
    ...options,
    mutationFn: createTaxJurisdiction,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxJurisdictions]);
      options?.onSuccess?.(...args);
    },
  });
}
