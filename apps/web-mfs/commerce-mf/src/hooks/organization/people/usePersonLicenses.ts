import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PartyLicensePayload, PartyLicenseRow, PartyLicensesTableResponse } from '@/schemas/party-licenses';
import {
  createPersonLicense,
  deletePersonLicense,
  getPersonLicenses,
  updatePersonLicense,
} from '@/services/organization/people.service';
import { PERSON_KEY, PERSON_LICENSES_TABLE_KEY } from './keys';

// Fetches a person's licenses; self-gates on the licenses view permission
export function usePersonLicensesTable(
  personId: string,
  options?: Omit<UseQueryOptions<PartyLicensesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.licenses.view);
  return useQuery<PartyLicensesTableResponse, AxiosError>({
    queryKey: PERSON_LICENSES_TABLE_KEY(personId),
    queryFn: () => getPersonLicenses(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}

export function useCreatePersonLicense(
  personId: string,
  options?: Omit<UseMutationOptions<PartyLicenseRow, AxiosError, PartyLicensePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyLicenseRow, AxiosError, PartyLicensePayload>({
    ...options,
    mutationFn: (data) => createPersonLicense({ personId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_LICENSES_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateLicenseVars {
  licenseId: string;
  data: PartyLicensePayload;
}

export function useUpdatePersonLicense(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateLicenseVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateLicenseVars>({
    ...options,
    mutationFn: ({ licenseId, data }) => updatePersonLicense({ personId, licenseId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_LICENSES_TABLE_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeletePersonLicense(
  personId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (licenseId) => deletePersonLicense({ personId, licenseId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PERSON_LICENSES_TABLE_KEY(personId) });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(personId) });
      options?.onSuccess?.(...args);
    },
  });
}
