import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateTaxRegistrationData, TaxRegistrationData } from '@/schemas/tax-registrations';
import { createTaxRegistration } from '@/services/legal-entity/tax-registrations.service';

type Vars = CreateTaxRegistrationData;
type Options = Omit<UseMutationOptions<CreateResponse<TaxRegistrationData>, AxiosError, Vars>, 'mutationFn'>;

export function useCreateTaxRegistration(options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<TaxRegistrationData>, AxiosError, Vars>({
    ...options,
    mutationFn: createTaxRegistration,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxRegistrations]);
      options?.onSuccess?.(...args);
    },
  });
}
