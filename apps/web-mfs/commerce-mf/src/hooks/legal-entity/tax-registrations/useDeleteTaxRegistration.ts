import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteTaxRegistration } from '@/services/legal-entity/tax-registrations.service';
import { TAX_REGISTRATIONS_KEY } from './keys';

type Vars = string;
type Options = Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>;

export function useDeleteTaxRegistration(options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: deleteTaxRegistration,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_REGISTRATIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
