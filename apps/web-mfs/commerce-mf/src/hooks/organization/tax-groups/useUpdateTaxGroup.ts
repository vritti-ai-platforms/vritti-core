import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateTaxGroupPayload } from '@/schemas/tax-groups';
import { updateTaxGroup } from '@/services/organization/tax-groups.service';

interface Vars {
  id: string;
  data: UpdateTaxGroupPayload;
}

// Updates a tax group and refreshes everything that shows its name or treatment
export function useUpdateTaxGroup(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxGroup,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxGroups]);
      options?.onSuccess?.(...args);
    },
  });
}
