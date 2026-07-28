import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { RepositoryStatsData } from '@/schemas/repositories';
import { getRepositoryStats } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORY_STATS_KEY } from './keys';

export function useRepositoryStats(
  name: string,
  ref?: string,
  options?: Omit<UseQueryOptions<RepositoryStatsData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.view);

  return useQuery<RepositoryStatsData, AxiosError>({
    queryKey: GITEA_REPOSITORY_STATS_KEY(name, ref),
    queryFn: () => getRepositoryStats(name, ref),
    // Commits, branches and tags all change outside this app, so the host's 5-minute default would
    // report counts from before a push
    staleTime: 0,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
