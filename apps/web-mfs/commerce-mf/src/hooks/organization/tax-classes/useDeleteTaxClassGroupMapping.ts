import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteTaxClassGroupMapping } from '@/services/organization/tax-classes.service';

interface Vars {
  taxClassId: string;
  mappingId: string;
}

// Deletes one of a tax class's group mappings and refreshes the class's groups and counts, the tax classes table and every tax group view
export function useDeleteTaxClassGroupMapping(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: deleteTaxClassGroupMapping,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxClassGroups]);
      options?.onSuccess?.(...args);
    },
  });
}
