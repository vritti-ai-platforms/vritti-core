import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CompanyData, CreateCompanyPayload } from '@/schemas/companies';
import { createCompany } from '@/services/organization/companies.service';

export function useCreateCompany(
  options?: Omit<UseMutationOptions<CreateResponse<CompanyData>, AxiosError, CreateCompanyPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<CompanyData>, AxiosError, CreateCompanyPayload>({
    ...options,
    mutationFn: createCompany,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.parties,
        Tables.partyCommunications,
        Tables.partySocialProfiles,
        Tables.partyAddresses,
        Tables.partyFunctions,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
