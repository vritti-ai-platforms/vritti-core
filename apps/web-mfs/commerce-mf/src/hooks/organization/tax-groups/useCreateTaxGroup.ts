import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateTaxGroupPayload, TaxGroupData } from '@/schemas/tax-groups';
import { createTaxGroup } from '@/services/organization/tax-groups.service';
import { TAX_GROUPS_TABLE_KEY } from './keys';

type UseCreateTaxGroupOptions = Omit<
  UseMutationOptions<CreateResponse<TaxGroupData>, AxiosError, CreateTaxGroupPayload>,
  'mutationFn'
>;

// Creates a tax group and refreshes the groups lists
export function useCreateTaxGroup(options?: UseCreateTaxGroupOptions) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<TaxGroupData>, AxiosError, CreateTaxGroupPayload>({
    ...options,
    mutationFn: createTaxGroup,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_GROUPS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
