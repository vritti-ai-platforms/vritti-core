import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateTaxClassGroupPayload } from '@/schemas/tax-groups';
import { updateTaxClassGroup } from '@/services/organization/tax-groups.service';

interface Vars {
  taxGroupId: string;
  mappingId: string;
  data: UpdateTaxClassGroupPayload;
}

// Updates a tax class mapping and refreshes the group, its classes and the tax classes table
export function useUpdateTaxClassGroup(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxClassGroup,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxClassGroups]);
      options?.onSuccess?.(...args);
    },
  });
}
