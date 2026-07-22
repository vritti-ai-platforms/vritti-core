import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  PartySocialProfilePayload,
  PartySocialProfileRow,
  PartySocialProfilesTableResponse,
} from '@/schemas/party-social-profiles';
import {
  createCompanySocialProfile,
  deleteCompanySocialProfile,
  getCompanySocialProfiles,
  updateCompanySocialProfile,
} from '@/services/organization/companies.service';
import { COMPANY_KEY, COMPANY_SOCIAL_PROFILES_TABLE_KEY } from './keys';

// Fetches a company's social profiles; self-gates on the social profiles view permission
export function useCompanySocialProfilesTable(
  companyId: string,
  options?: Omit<UseQueryOptions<PartySocialProfilesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.socialProfiles.view);
  return useQuery<PartySocialProfilesTableResponse, AxiosError>({
    queryKey: COMPANY_SOCIAL_PROFILES_TABLE_KEY(companyId),
    queryFn: () => getCompanySocialProfiles(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useCreateCompanySocialProfile(
  companyId: string,
  options?: Omit<UseMutationOptions<PartySocialProfileRow, AxiosError, PartySocialProfilePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartySocialProfileRow, AxiosError, PartySocialProfilePayload>({
    ...options,
    mutationFn: (data) => createCompanySocialProfile({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_SOCIAL_PROFILES_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateSocialProfileVars {
  profileId: string;
  data: PartySocialProfilePayload;
}

export function useUpdateCompanySocialProfile(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSocialProfileVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSocialProfileVars>({
    ...options,
    mutationFn: ({ profileId, data }) => updateCompanySocialProfile({ companyId, profileId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_SOCIAL_PROFILES_TABLE_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteCompanySocialProfile(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (profileId) => deleteCompanySocialProfile({ companyId, profileId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_SOCIAL_PROFILES_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
