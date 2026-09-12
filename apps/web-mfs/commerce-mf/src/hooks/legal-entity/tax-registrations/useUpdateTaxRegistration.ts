import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateTaxRegistrationData } from '@/schemas/tax-registrations';
import { updateTaxRegistration } from '@/services/legal-entity/tax-registrations.service';
import { TAX_REGISTRATIONS_KEY } from './keys';

type Vars = { id: string; data: UpdateTaxRegistrationData };
type Options = Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>;

export function useUpdateTaxRegistration(options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxRegistration,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_REGISTRATIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
