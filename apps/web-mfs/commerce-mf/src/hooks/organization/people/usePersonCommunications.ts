import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartyCommunicationPayload,
  PartyCommunicationRow,
  PartyCommunicationsTableResponse,
  PartyCommunicationUpdatePayload,
} from '@/schemas/party-communications';
import {
  createPersonCommunication,
  deletePersonCommunication,
  getPersonCommunications,
  updatePersonCommunication,
} from '@/services/organization/people.service';
import { PERSON_COMMUNICATIONS_TABLE_KEY, PERSON_KEY } from './keys';

// Fetches a person's communications; self-gates on the communications view permission
export function usePersonCommunicationsTable(
  personId: string,
  options?: Omit<UseQueryOptions<PartyCommunicationsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.communications.view);
  return useQuery<PartyCommunicationsTableResponse, AxiosError>({
    queryKey: PERSON_COMMUNICATIONS_TABLE_KEY(personId),
    queryFn: () => getPersonCommunications(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useCreatePersonCommunication(
  personId: string,
  options?: Omit<UseMutationOptions<PartyCommunicationRow, AxiosError, PartyCommunicationPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyCommunicationRow, AxiosError, PartyCommunicationPayload>({
    ...options,
    mutationFn: (data) => createPersonCommunication({ personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_COMMUNICATIONS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateCommunicationVars {
  communicationId: string;
  data: PartyCommunicationUpdatePayload;
}

export function useUpdatePersonCommunication(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateCommunicationVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateCommunicationVars>({
    ...options,
    mutationFn: ({ communicationId, data }) => updatePersonCommunication({ personId, communicationId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_COMMUNICATIONS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeletePersonCommunication(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (communicationId) => deletePersonCommunication({ personId, communicationId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_COMMUNICATIONS_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
