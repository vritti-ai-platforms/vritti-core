import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { RepositoriesTableResponse } from '@/schemas/repositories';
import { getRepositoriesTable } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORIES_TABLE_KEY } from './keys';

// Fetches the repositories table. The key carries no page: the server reads the pushed table state,
// so a page change is an invalidation of this one key rather than a new key.
export function useRepositories(
  options?: Omit<UseQueryOptions<RepositoriesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.view);

  return useQuery<RepositoriesTableResponse, AxiosError>({
    queryKey: GITEA_REPOSITORIES_TABLE_KEY,
    queryFn: getRepositoriesTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
