import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { RepositoryContentsData, RepositoryContentsParams } from '@/schemas/repositories';
import { getRepositoryContents } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORY_CONTENTS_KEY } from './keys';

export function useRepositoryContents(
  name: string,
  params: RepositoryContentsParams,
  options?: Omit<UseQueryOptions<RepositoryContentsData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.code.view);

  return useQuery<RepositoryContentsData, AxiosError>({
    queryKey: GITEA_REPOSITORY_CONTENTS_KEY(name, params.path, params.ref),
    queryFn: () => getRepositoryContents(name, params),
    // The key holds a branch name, and branches move under it. The host's 5-minute default would keep
    // serving a pre-push tree with nothing to signal it, so revalidate behind the cached copy instead —
    // the tree still paints instantly, then corrects itself.
    staleTime: 0,
    ...options,
    // Callers switch this off for a repository with no commits — every path 404s until the first push
    enabled: available && (options?.enabled ?? true),
  });
}
