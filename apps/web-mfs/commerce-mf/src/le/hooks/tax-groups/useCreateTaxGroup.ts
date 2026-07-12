import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { createTaxGroup } from '@/le/services/tax-groups.service';
import type { CreateTaxGroupData, TaxGroupData } from '@/schemas/tax-groups';
import { TAX_GROUPS_KEY } from './keys';

// Creates a tax group and invalidates tax-group queries
export function useCreateTaxGroup(
  options?: Omit<UseMutationOptions<CreateResponse<TaxGroupData>, AxiosError, CreateTaxGroupData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<TaxGroupData>, AxiosError, CreateTaxGroupData>({
    ...options,
    mutationFn: createTaxGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
