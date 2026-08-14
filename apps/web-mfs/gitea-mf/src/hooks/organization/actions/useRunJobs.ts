import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { JobListResponse } from '@/schemas/actions';
import { listRunJobs } from '@/services/organization/actions.service';
import { ACTIVE_POLL_INTERVAL_MS, GITEA_RUN_JOBS_KEY } from './keys';

export function useRunJobs(
  name: string,
  runId: number,
  options?: Omit<UseQueryOptions<JobListResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.actions.runs.view);

  return useQuery<JobListResponse, AxiosError>({
    queryKey: GITEA_RUN_JOBS_KEY(name, runId),
    queryFn: () => listRunJobs(name, runId),
    staleTime: 0,
    // Steps land one at a time while a job runs, so this polls until every job of the run is terminal
    refetchInterval: (query) => (query.state.data?.items.some((job) => job.isActive) ? ACTIVE_POLL_INTERVAL_MS : false),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
