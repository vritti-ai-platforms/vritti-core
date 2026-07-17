import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddIdentifierPayload, PartyIdentifierRow, PartyIdentifiersTableResponse } from '@/schemas/party-identifiers';
import { addPersonIdentifier, getPersonIdentifiers, removePersonIdentifier } from '@/services/organization/people.service';
import { PERSON_IDENTIFIERS_KEY, PERSON_KEY } from './keys';

// Fetches a person's identifiers; self-gates on the identifiers view permission
export function usePersonIdentifiers(
  personId: string,
  options?: Omit<UseQueryOptions<PartyIdentifiersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.identifiers.view);
  return useQuery<PartyIdentifiersTableResponse, AxiosError>({
    queryKey: PERSON_IDENTIFIERS_KEY(personId),
    queryFn: () => getPersonIdentifiers(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useAddPersonIdentifier(
  personId: string,
  options?: Omit<UseMutationOptions<PartyIdentifierRow, AxiosError, AddIdentifierPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyIdentifierRow, AxiosError, AddIdentifierPayload>({
    ...options,
    mutationFn: (data) => addPersonIdentifier({ personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_IDENTIFIERS_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemovePersonIdentifier(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (identifierId) => removePersonIdentifier({ personId, identifierId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_IDENTIFIERS_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
