import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateTaxClassGroupPayload, TaxClassGroupData } from '@/schemas/tax-groups';
import { createTaxClassGroup } from '@/services/organization/tax-groups.service';
import { TAX_CLASSES_TABLE_KEY } from '../tax-classes/keys';
import { TAX_GROUP_KEY, TAX_GROUPS_TABLE_KEY } from './keys';

interface Vars {
  taxGroupId: string;
  data: CreateTaxClassGroupPayload;
}

// Maps a tax class to a tax group and refreshes the group, its classes and the tax classes table
export function useCreateTaxClassGroup(
  options?: Omit<UseMutationOptions<CreateResponse<TaxClassGroupData>, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<TaxClassGroupData>, AxiosError, Vars>({
    ...options,
    mutationFn: createTaxClassGroup,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_GROUP_KEY(vars.taxGroupId) });
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
