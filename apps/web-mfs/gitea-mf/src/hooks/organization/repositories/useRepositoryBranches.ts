import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { BranchListResponse } from '@/schemas/repositories';
import { listBranches } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORY_BRANCHES_KEY } from './keys';

export function useRepositoryBranches(
  name: string,
  options?: Omit<UseQueryOptions<BranchListResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.view);

  return useQuery<BranchListResponse, AxiosError>({
    queryKey: GITEA_REPOSITORY_BRANCHES_KEY(name),
    queryFn: () => listBranches(name),
    // Branches are created outside this app, so the host's 5-minute default would hide a freshly
    // pushed branch from the picker
    staleTime: 0,
    ...options,
    // Callers switch this off for a repository with no commits — it has no branches to list yet
    enabled: available && (options?.enabled ?? true),
  });
}
