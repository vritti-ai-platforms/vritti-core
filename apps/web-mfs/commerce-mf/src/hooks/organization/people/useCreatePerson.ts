import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { PersonData } from '@/schemas/people';
import { type CreatePersonPayload, createPerson } from '@/services/organization/people.service';

export function useCreatePerson(
  options?: Omit<UseMutationOptions<PersonData, AxiosError, CreatePersonPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PersonData, AxiosError, CreatePersonPayload>({
    ...options,
    mutationFn: createPerson,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.parties,
        Tables.partyCommunications,
        Tables.partySocialProfiles,
        Tables.partyIdentifiers,
        Tables.partyAddresses,
        Tables.partyFunctions,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
