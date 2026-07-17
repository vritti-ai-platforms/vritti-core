import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  CompanyRegistrationFormData,
  CompanyRegistrationsTableResponse,
  CompanyTaxRegistrationRow,
} from '@/schemas/companies';
import {
  createCompanyRegistration,
  deleteCompanyRegistration,
  getCompanyRegistrations,
  updateCompanyRegistration,
} from '@/services/organization/companies.service';
import { COMPANY_KEY, COMPANY_REGISTRATIONS_TABLE_KEY } from './keys';

// Fetches a company's tax registrations; self-gates on the companies view permission
export function useCompanyRegistrationsTable(
  companyId: string,
  options?: Omit<UseQueryOptions<CompanyRegistrationsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.view);
  return useQuery<CompanyRegistrationsTableResponse, AxiosError>({
    queryKey: COMPANY_REGISTRATIONS_TABLE_KEY(companyId),
    queryFn: () => getCompanyRegistrations(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useCreateCompanyRegistration(
  companyId: string,
  options?: Omit<UseMutationOptions<CompanyTaxRegistrationRow, AxiosError, CompanyRegistrationFormData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CompanyTaxRegistrationRow, AxiosError, CompanyRegistrationFormData>({
    ...options,
    mutationFn: (data) => createCompanyRegistration({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_REGISTRATIONS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateRegistrationVars {
  registrationId: string;
  data: CompanyRegistrationFormData;
}

export function useUpdateCompanyRegistration(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateRegistrationVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateRegistrationVars>({
    ...options,
    mutationFn: ({ registrationId, data }) => updateCompanyRegistration({ companyId, registrationId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_REGISTRATIONS_TABLE_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteCompanyRegistration(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (registrationId) => deleteCompanyRegistration({ companyId, registrationId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_REGISTRATIONS_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
