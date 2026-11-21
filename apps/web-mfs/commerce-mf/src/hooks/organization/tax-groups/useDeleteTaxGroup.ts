import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteTaxGroup } from '@/services/organization/tax-groups.service';

// Deletes a tax group and refreshes the groups lists
export function useDeleteTaxGroup(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxGroup,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxGroups, Tables.taxGroupRates]);
      options?.onSuccess?.(...args);
    },
  });
}
