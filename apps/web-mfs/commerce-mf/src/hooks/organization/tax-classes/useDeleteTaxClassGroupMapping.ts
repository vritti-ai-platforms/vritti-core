import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteTaxClassGroupMapping } from '@/services/organization/tax-classes.service';
import { TAX_GROUPS_KEY } from '../tax-groups/keys';
import { TAX_CLASS_GROUPS_TABLE_KEY, TAX_CLASSES_TABLE_KEY } from './keys';

interface Vars {
  taxClassId: string;
  mappingId: string;
}

// Deletes one of a tax class's group mappings and refreshes the class's groups, the tax classes table and every tax group view
export function useDeleteTaxClassGroupMapping(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: deleteTaxClassGroupMapping,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_CLASS_GROUPS_TABLE_KEY(vars.taxClassId) });
      queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
