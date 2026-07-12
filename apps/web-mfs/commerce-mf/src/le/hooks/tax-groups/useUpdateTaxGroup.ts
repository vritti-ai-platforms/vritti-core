import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { updateTaxGroup } from '@/le/services/tax-groups.service';
import type { UpdateTaxGroupData } from '@/schemas/tax-groups';
import { TAX_GROUP_KEY, TAX_GROUPS_KEY } from './keys';

// Updates a tax group and invalidates tax-group queries
export function useUpdateTaxGroup(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateTaxGroupData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateTaxGroupData }>({
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
