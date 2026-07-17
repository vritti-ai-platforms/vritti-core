import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { deleteTaxJurisdiction } from '@/services/organization/tax-jurisdictions.service';
import type { SuccessResponse } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTIONS_KEY } from './keys';

export function useDeleteTaxJurisdiction(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxJurisdiction,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_JURISDICTIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
