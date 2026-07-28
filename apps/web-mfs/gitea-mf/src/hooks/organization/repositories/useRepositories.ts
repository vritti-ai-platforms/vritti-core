import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { RepositoryListParams, RepositoryListResponse } from '@/schemas/repositories';
import { listRepositories } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORIES_KEY } from './keys';

export function useRepositories(
  params: RepositoryListParams,
  options?: Omit<UseQueryOptions<RepositoryListResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.view);

  return useQuery<RepositoryListResponse, AxiosError>({
    queryKey: [...GITEA_REPOSITORIES_KEY, params.page, params.limit],
    queryFn: () => listRepositories(params),
    // Page changes alter the query key; keeping the previous page visible avoids a skeleton flash
    placeholderData: keepPreviousData,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
