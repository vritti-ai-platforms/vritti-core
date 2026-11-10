import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateTaxClassGroupMappingPayload } from '@/schemas/tax-classes';
import type { TaxClassGroupData } from '@/schemas/tax-groups';
import { createTaxClassGroupMapping } from '@/services/organization/tax-classes.service';
import { TAX_GROUPS_KEY } from '../tax-groups/keys';
import { TAX_CLASS_GROUPS_TABLE_KEY, TAX_CLASSES_TABLE_KEY } from './keys';

interface Vars {
  taxClassId: string;
  data: CreateTaxClassGroupMappingPayload;
}

// Maps a tax class to a tax group and refreshes the class's groups, the tax classes table and every tax group view
export function useCreateTaxClassGroupMapping(
  options?: Omit<UseMutationOptions<CreateResponse<TaxClassGroupData>, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<TaxClassGroupData>, AxiosError, Vars>({
    ...options,
    mutationFn: createTaxClassGroupMapping,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: TAX_CLASS_GROUPS_TABLE_KEY(vars.taxClassId) });
      queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
