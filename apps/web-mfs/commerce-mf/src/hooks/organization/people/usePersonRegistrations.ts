import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartyRegistrationFormData,
  PartyRegistrationsTableResponse,
  PartyTaxRegistrationRow,
} from '@/schemas/party-registrations';
import {
  createPersonRegistration,
  deletePersonRegistration,
  getPersonRegistrations,
  updatePersonRegistration,
} from '@/services/organization/people.service';
import { PERSON_KEY, PERSON_REGISTRATIONS_TABLE_KEY } from './keys';

// Fetches a person's tax registrations; self-gates on the registrations view permission
export function usePersonRegistrationsTable(
  personId: string,
  options?: Omit<UseQueryOptions<PartyRegistrationsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.registrations.view);
  return useQuery<PartyRegistrationsTableResponse, AxiosError>({
    queryKey: PERSON_REGISTRATIONS_TABLE_KEY(personId),
    queryFn: () => getPersonRegistrations(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useCreatePersonRegistration(
  personId: string,
  options?: Omit<UseMutationOptions<PartyTaxRegistrationRow, AxiosError, PartyRegistrationFormData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyTaxRegistrationRow, AxiosError, PartyRegistrationFormData>({
    ...options,
    mutationFn: (data) => createPersonRegistration({ personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_REGISTRATIONS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateRegistrationVars {
  registrationId: string;
  data: PartyRegistrationFormData;
}

export function useUpdatePersonRegistration(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateRegistrationVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateRegistrationVars>({
    ...options,
    mutationFn: ({ registrationId, data }) => updatePersonRegistration({ personId, registrationId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_REGISTRATIONS_TABLE_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeletePersonRegistration(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (registrationId) => deletePersonRegistration({ personId, registrationId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_REGISTRATIONS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
