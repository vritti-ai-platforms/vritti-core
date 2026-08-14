import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { WorkflowListResponse } from '@/schemas/actions';
import { listWorkflows } from '@/services/organization/actions.service';
import { GITEA_WORKFLOWS_KEY } from './keys';

export function useWorkflows(
  name: string,
  options?: Omit<UseQueryOptions<WorkflowListResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.actions.workflows.view);

  return useQuery<WorkflowListResponse, AxiosError>({
    queryKey: GITEA_WORKFLOWS_KEY(name),
    queryFn: () => listWorkflows(name),
    // Workflow files are added, edited and disabled outside this app, so the host's 5-minute default would
    // keep a freshly pushed workflow out of the list
    staleTime: 0,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
