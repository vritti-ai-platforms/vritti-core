import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteTaxGroup } from '@/services/tax-groups.service';
import { TAX_GROUP_KEY, TAX_GROUPS_KEY } from './keys';

// Deletes a tax group and invalidates tax-group queries
export function useDeleteTaxGroup(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxGroup,
    onSuccess: (...args) => {
      const id = args[1];
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_KEY });
      queryClient.invalidateQueries({ queryKey: [...TAX_GROUP_KEY, id] });
      options?.onSuccess?.(...args);
    },
  });
}
