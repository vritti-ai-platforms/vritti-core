import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SuccessResponse } from '@/schemas/tax-jurisdictions';
import { deleteTaxJurisdiction } from '@/services/organization/tax-jurisdictions.service';

export function useDeleteTaxJurisdiction(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxJurisdiction,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxJurisdictions]);
      options?.onSuccess?.(...args);
    },
  });
}
