import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartySocialProfilePayload,
  PartySocialProfileRow,
  PartySocialProfilesTableResponse,
} from '@/schemas/party-social-profiles';
import {
  createPersonSocialProfile,
  deletePersonSocialProfile,
  getPersonSocialProfiles,
  updatePersonSocialProfile,
} from '@/services/organization/people.service';
import { PERSON_KEY, PERSON_SOCIAL_PROFILES_TABLE_KEY } from './keys';

// Fetches a person's social profiles; self-gates on the social profiles view permission
export function usePersonSocialProfilesTable(
  personId: string,
  options?: Omit<UseQueryOptions<PartySocialProfilesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.socialProfiles.view);
  return useQuery<PartySocialProfilesTableResponse, AxiosError>({
    queryKey: PERSON_SOCIAL_PROFILES_TABLE_KEY(personId),
    queryFn: () => getPersonSocialProfiles(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useCreatePersonSocialProfile(
  personId: string,
  options?: Omit<UseMutationOptions<PartySocialProfileRow, AxiosError, PartySocialProfilePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartySocialProfileRow, AxiosError, PartySocialProfilePayload>({
    ...options,
    mutationFn: (data) => createPersonSocialProfile({ personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_SOCIAL_PROFILES_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateSocialProfileVars {
  profileId: string;
  data: PartySocialProfilePayload;
}

export function useUpdatePersonSocialProfile(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSocialProfileVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSocialProfileVars>({
    ...options,
    mutationFn: ({ profileId, data }) => updatePersonSocialProfile({ personId, profileId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_SOCIAL_PROFILES_TABLE_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeletePersonSocialProfile(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (profileId) => deletePersonSocialProfile({ personId, profileId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_SOCIAL_PROFILES_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
