import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateTaxClassGroupPayload, TaxClassGroupData } from '@/schemas/tax-groups';
import { createTaxClassGroup } from '@/services/organization/tax-groups.service';

interface Vars {
  taxGroupId: string;
  data: CreateTaxClassGroupPayload;
}

// Maps a tax class to a tax group and refreshes the group, its classes and every tax class view
export function useCreateTaxClassGroup(
  options?: Omit<UseMutationOptions<CreateResponse<TaxClassGroupData>, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<TaxClassGroupData>, AxiosError, Vars>({
    ...options,
    mutationFn: createTaxClassGroup,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxClassGroups]);
      options?.onSuccess?.(...args);
    },
  });
}
