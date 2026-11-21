import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type {
  CompanyRegistrationPayload,
  CompanyRegistrationsTableResponse,
  CompanyTaxRegistrationRow,
} from '@/schemas/companies';
import {
  createCompanyRegistration,
  deleteCompanyRegistration,
  getCompanyRegistrations,
  setCompanyRegistrationActive,
  updateCompanyRegistration,
} from '@/services/organization/companies.service';
import { COMPANY_REGISTRATIONS_TABLE_KEY } from './keys';

// Fetches a company's tax registrations; self-gates on the registrations view permission
export function useCompanyRegistrationsTable(
  companyId: string,
  options?: Omit<UseQueryOptions<CompanyRegistrationsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.registrations.view);
  return useQuery<CompanyRegistrationsTableResponse, AxiosError>({
    queryKey: COMPANY_REGISTRATIONS_TABLE_KEY(companyId),
    queryFn: () => getCompanyRegistrations(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useCreateCompanyRegistration(
  companyId: string,
  options?: Omit<UseMutationOptions<CompanyTaxRegistrationRow, AxiosError, CompanyRegistrationPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CompanyTaxRegistrationRow, AxiosError, CompanyRegistrationPayload>({
    ...options,
    mutationFn: (data) => createCompanyRegistration({ companyId, data }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.partyTaxRegistrations]);
      options?.onSuccess?.(...args);
    },
  });
}

interface SetRegistrationActiveVars {
  registrationId: string;
  isActive: boolean;
}

interface UpdateRegistrationVars {
  registrationId: string;
  data: CompanyRegistrationPayload;
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
      invalidateWrites(queryClient, [Tables.partyTaxRegistrations]);
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
      invalidateWrites(queryClient, [Tables.partyTaxRegistrations]);
      options?.onSuccess?.(...args);
    },
  });
}

// Activates or retires a registration through its dedicated status endpoint
export function useSetCompanyRegistrationActive(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetRegistrationActiveVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetRegistrationActiveVars>({
    ...options,
    mutationFn: ({ registrationId, isActive }) => setCompanyRegistrationActive({ companyId, registrationId, isActive }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.partyTaxRegistrations]);
      options?.onSuccess?.(...args);
    },
  });
}
