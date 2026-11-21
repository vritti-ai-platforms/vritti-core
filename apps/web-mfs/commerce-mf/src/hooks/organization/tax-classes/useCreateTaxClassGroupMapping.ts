import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateTaxClassGroupMappingPayload } from '@/schemas/tax-classes';
import type { TaxClassGroupData } from '@/schemas/tax-groups';
import { createTaxClassGroupMapping } from '@/services/organization/tax-classes.service';

interface Vars {
  taxClassId: string;
  data: CreateTaxClassGroupMappingPayload;
}

// Maps a tax class to a tax group and refreshes the class's groups and counts, the tax classes table and every tax group view
export function useCreateTaxClassGroupMapping(
  options?: Omit<UseMutationOptions<CreateResponse<TaxClassGroupData>, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<TaxClassGroupData>, AxiosError, Vars>({
    ...options,
    mutationFn: createTaxClassGroupMapping,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxClassGroups]);
      options?.onSuccess?.(...args);
    },
  });
}
