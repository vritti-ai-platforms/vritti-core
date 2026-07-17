import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { updateTaxJurisdiction } from '@/services/organization/tax-jurisdictions.service';
import type { SuccessResponse, TaxJurisdictionFormData } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTIONS_KEY } from './keys';

type UpdateTaxJurisdictionVariables = { id: string; data: Partial<TaxJurisdictionFormData> };

export function useUpdateTaxJurisdiction(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateTaxJurisdictionVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateTaxJurisdictionVariables>({
    ...options,
    mutationFn: updateTaxJurisdiction,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_JURISDICTIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
