import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CompaniesTableResponse } from '@/schemas/companies';
import { getCompaniesTable } from '@/services/organization/companies.service';
import { COMPANIES_TABLE_KEY } from './keys';

// Fetches ORG companies table; self-gates the GET on the companies view permission
export function useCompaniesTable(
  options?: Omit<UseQueryOptions<CompaniesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COMPANIES.view);
  return useQuery<CompaniesTableResponse, AxiosError>({
    queryKey: [...COMPANIES_TABLE_KEY],
    queryFn: getCompaniesTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
