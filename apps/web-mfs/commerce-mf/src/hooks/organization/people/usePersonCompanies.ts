import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PersonCompaniesTableResponse } from '@/schemas/people';
import { getPersonCompanies } from '@/services/organization/people.service';
import { PERSON_COMPANIES_TABLE_KEY } from './keys';

// Fetches the companies a person is linked to; self-gates on the people view permission
export function usePersonCompanies(
  personId: string,
  options?: Omit<UseQueryOptions<PersonCompaniesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.view);
  return useQuery<PersonCompaniesTableResponse, AxiosError>({
    queryKey: PERSON_COMPANIES_TABLE_KEY(personId),
    queryFn: () => getPersonCompanies(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}
