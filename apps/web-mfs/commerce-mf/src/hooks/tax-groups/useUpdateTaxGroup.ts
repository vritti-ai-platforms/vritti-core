import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxGroupData, UpdateTaxGroupData } from '@/schemas/tax-groups';
import { updateTaxGroup } from '@/services/tax-groups.service';
import { TAX_GROUP_KEY, TAX_GROUPS_KEY } from './keys';

// Updates a tax group and invalidates tax-group queries
export function useUpdateTaxGroup(
  options?: Omit<UseMutationOptions<TaxGroupData, AxiosError, { id: string; data: UpdateTaxGroupData }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<TaxGroupData, AxiosError, { id: string; data: UpdateTaxGroupData }>({
    ...options,
    mutationFn: updateTaxGroup,
    onSuccess: (...args) => {
      const variables = args[1];
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_KEY });
      queryClient.invalidateQueries({ queryKey: [...TAX_GROUP_KEY, variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
