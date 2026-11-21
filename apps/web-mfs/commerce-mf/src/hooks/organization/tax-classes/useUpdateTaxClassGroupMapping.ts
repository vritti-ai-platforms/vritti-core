import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateTaxClassGroupMappingPayload } from '@/schemas/tax-classes';
import { updateTaxClassGroupMapping } from '@/services/organization/tax-classes.service';

interface Vars {
  taxClassId: string;
  mappingId: string;
  data: UpdateTaxClassGroupMappingPayload;
}

// Updates one of a tax class's group mappings and refreshes the class's groups, the tax classes table and every tax group view
export function useUpdateTaxClassGroupMapping(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxClassGroupMapping,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxClassGroups]);
      options?.onSuccess?.(...args);
    },
  });
}
