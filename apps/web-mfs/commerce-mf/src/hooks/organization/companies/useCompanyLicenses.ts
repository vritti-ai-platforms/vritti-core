import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PartyLicensePayload, PartyLicenseRow, PartyLicensesTableResponse } from '@/schemas/party-licenses';
import {
  createCompanyLicense,
  deleteCompanyLicense,
  getCompanyLicenses,
  updateCompanyLicense,
} from '@/services/organization/companies.service';
import { COMPANY_KEY, COMPANY_LICENSES_TABLE_KEY } from './keys';

// Fetches a company's licenses; self-gates on the licenses view permission
export function useCompanyLicensesTable(
  companyId: string,
  options?: Omit<UseQueryOptions<PartyLicensesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.licenses.view);
  return useQuery<PartyLicensesTableResponse, AxiosError>({
    queryKey: COMPANY_LICENSES_TABLE_KEY(companyId),
    queryFn: () => getCompanyLicenses(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useCreateCompanyLicense(
  companyId: string,
  options?: Omit<UseMutationOptions<PartyLicenseRow, AxiosError, PartyLicensePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PartyLicenseRow, AxiosError, PartyLicensePayload>({
    ...options,
    mutationFn: (data) => createCompanyLicense({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_LICENSES_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateLicenseVars {
  licenseId: string;
  data: PartyLicensePayload;
}

export function useUpdateCompanyLicense(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateLicenseVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateLicenseVars>({
    ...options,
    mutationFn: ({ licenseId, data }) => updateCompanyLicense({ companyId, licenseId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_LICENSES_TABLE_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteCompanyLicense(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (licenseId) => deleteCompanyLicense({ companyId, licenseId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_LICENSES_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
