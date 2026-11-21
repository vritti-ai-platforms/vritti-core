import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { type UpdatePersonPayload, updatePerson } from '@/services/organization/people.service';

interface Vars {
  id: string;
  data: UpdatePersonPayload;
}

export function useUpdatePerson(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updatePerson,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.parties,
        Tables.partyCommunications,
        Tables.partyCommunicationApps,
        Tables.partyFunctions,
        Tables.partySocialProfiles,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
