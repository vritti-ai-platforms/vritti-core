import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PeopleTableResponse } from '@/schemas/people';
import { getPeopleTable } from '@/services/organization/people.service';
import { PEOPLE_TABLE_KEY } from './keys';

// Fetches ORG people table; self-gates the GET on the people view permission
export function usePeopleTable(
  options?: Omit<UseQueryOptions<PeopleTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.view);
  return useQuery<PeopleTableResponse, AxiosError>({
    queryKey: [...PEOPLE_TABLE_KEY],
    queryFn: getPeopleTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
