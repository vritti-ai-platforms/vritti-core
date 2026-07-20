import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartyContactPayload,
  PartyContactRow,
  PartyContactsTableResponse,
  PartyContactUpdatePayload,
} from '@/schemas/party-contacts';
import {
  createPersonContact,
  deletePersonContact,
  getPersonContacts,
  updatePersonContact,
} from '@/services/organization/people.service';
import { PERSON_CONTACTS_TABLE_KEY, PERSON_KEY } from './keys';

// Fetches a person's contacts; self-gates on the contacts view permission
export function usePersonContactsTable(
  personId: string,
  options?: Omit<UseQueryOptions<PartyContactsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.contacts.view);
  return useQuery<PartyContactsTableResponse, AxiosError>({
    queryKey: PERSON_CONTACTS_TABLE_KEY(personId),
    queryFn: () => getPersonContacts(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useCreatePersonContact(
  personId: string,
  options?: Omit<UseMutationOptions<PartyContactRow, AxiosError, PartyContactPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyContactRow, AxiosError, PartyContactPayload>({
    ...options,
    mutationFn: (data) => createPersonContact({ personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_CONTACTS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateContactVars {
  contactId: string;
  data: PartyContactUpdatePayload;
}

export function useUpdatePersonContact(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateContactVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateContactVars>({
    ...options,
    mutationFn: ({ contactId, data }) => updatePersonContact({ personId, contactId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_CONTACTS_TABLE_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeletePersonContact(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (contactId) => deletePersonContact({ personId, contactId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_CONTACTS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
