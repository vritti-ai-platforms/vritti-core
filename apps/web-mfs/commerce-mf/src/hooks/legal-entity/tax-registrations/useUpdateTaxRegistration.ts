import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateTaxRegistrationData } from '@/schemas/tax-registrations';
import { updateTaxRegistration } from '@/services/legal-entity/tax-registrations.service';

type Vars = { id: string; data: UpdateTaxRegistrationData };
type Options = Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>;

export function useUpdateTaxRegistration(options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateTaxRegistration,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.taxRegistrations]);
      options?.onSuccess?.(...args);
    },
  });
}
