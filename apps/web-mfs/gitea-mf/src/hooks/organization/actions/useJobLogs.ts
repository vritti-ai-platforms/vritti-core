import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { JobLogsData } from '@/schemas/actions';
import { getJobLogs } from '@/services/organization/actions.service';
import { ACTIVE_POLL_INTERVAL_MS, GITEA_JOB_LOGS_KEY } from './keys';

// isJobActive is a required argument rather than an option: the log payload carries no isActive of its own,
// so the job that produces it is the only thing that can say when tailing has to stop.
export function useJobLogs(
  name: string,
  jobId: number,
  isJobActive: boolean,
  options?: Omit<UseQueryOptions<JobLogsData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.logs.view);

  return useQuery<JobLogsData, AxiosError>({
    // The phase in the key turns the job's completion into one final read
    queryKey: GITEA_JOB_LOGS_KEY(name, jobId, isJobActive ? 'tailing' : 'final'),
    queryFn: () => getJobLogs(name, jobId),
    // Keeps the tailed output on screen while that final read is in flight, instead of flashing a skeleton
    placeholderData: keepPreviousData,
    staleTime: 0,
    // A finished job's log is immutable, so polling ends with the job
    refetchInterval: isJobActive ? ACTIVE_POLL_INTERVAL_MS : false,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
