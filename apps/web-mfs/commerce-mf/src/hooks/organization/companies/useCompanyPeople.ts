import type { UseMutationOptions } from '@tanstack/react-query';
import { type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddCompanyPersonPayload, CompanyPeopleTableResponse, CompanyPersonRow } from '@/schemas/companies';
import { addCompanyPerson, getCompanyPeople, removeCompanyPerson } from '@/services/organization/companies.service';
import { COMPANY_KEY, COMPANY_PEOPLE_TABLE_KEY } from './keys';

// Fetches a company's linked people; self-gates on the companies view permission
export function useCompanyPeopleTable(
  companyId: string,
  options?: Omit<UseQueryOptions<CompanyPeopleTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.view);
  return useQuery<CompanyPeopleTableResponse, AxiosError>({
    queryKey: COMPANY_PEOPLE_TABLE_KEY(companyId),
    queryFn: () => getCompanyPeople(companyId),
    ...options,
    enabled: !!companyId && available && (options?.enabled ?? true),
  });
}

export function useAddCompanyPerson(
  companyId: string,
  options?: Omit<UseMutationOptions<CompanyPersonRow, AxiosError, AddCompanyPersonPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CompanyPersonRow, AxiosError, AddCompanyPersonPayload>({
    ...options,
    mutationFn: (data) => addCompanyPerson({ companyId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_PEOPLE_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveCompanyPerson(
  companyId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (companyPersonId) => removeCompanyPerson({ companyId, companyPersonId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANY_PEOPLE_TABLE_KEY(companyId) });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(companyId) });
      options?.onSuccess?.(...args);
    },
  });
}
