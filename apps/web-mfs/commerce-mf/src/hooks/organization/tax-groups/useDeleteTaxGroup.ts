import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteTaxGroup } from '@/services/organization/tax-groups.service';
import { TAX_GROUPS_TABLE_KEY } from './keys';

// Deletes a tax group and refreshes the groups lists
export function useDeleteTaxGroup(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
