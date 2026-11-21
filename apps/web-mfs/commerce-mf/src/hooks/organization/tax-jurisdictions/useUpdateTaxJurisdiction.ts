import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SuccessResponse, TaxJurisdictionPayload } from '@/schemas/tax-jurisdictions';
import { updateTaxJurisdiction } from '@/services/organization/tax-jurisdictions.service';

type UpdateTaxJurisdictionVariables = { id: string; data: TaxJurisdictionPayload };

export function useUpdateTaxJurisdiction(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateTaxJurisdictionVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateTaxJurisdictionVariables>({
    ...options,
    mutationFn: updateTaxJurisdiction,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxJurisdictions]);
      options?.onSuccess?.(...args);
    },
  });
}
