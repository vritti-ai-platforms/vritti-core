import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateCompanyPayload } from '@/schemas/companies';
import { updateCompany } from '@/services/organization/companies.service';

interface Vars {
  id: string;
  data: UpdateCompanyPayload;
}

export function useUpdateCompany(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateCompany,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.parties,
        Tables.partyCommunications,
        Tables.partyCommunicationApps,
        Tables.partyFunctions,
        Tables.partySocialProfiles,
        Tables.partyAddresses,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
