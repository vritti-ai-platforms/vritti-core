import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { createTaxJurisdiction } from '@/services/organization/tax-jurisdictions.service';
import type { TaxJurisdictionCreateResponse, TaxJurisdictionFormData } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTIONS_KEY } from './keys';

export function useCreateTaxJurisdiction(
  options?: Omit<UseMutationOptions<TaxJurisdictionCreateResponse, AxiosError, TaxJurisdictionFormData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<TaxJurisdictionCreateResponse, AxiosError, TaxJurisdictionFormData>({
    ...options,
    mutationFn: createTaxJurisdiction,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_JURISDICTIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
