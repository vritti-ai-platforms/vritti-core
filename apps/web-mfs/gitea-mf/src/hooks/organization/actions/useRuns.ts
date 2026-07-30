import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { RunsTableParams, RunsTableResponse } from '@/schemas/actions';
import { getRunsTable } from '@/services/organization/actions.service';
import { GITEA_RUNS_TABLE_KEY } from './keys';
import { ACTIVE_POLL_INTERVAL_MS } from './polling';

// Fetches the workflow runs table. The key carries the workflow filter but no page: the server reads
// the pushed table state, so a page change is an invalidation of the same key.
export function useRuns(
  name: string,
  params: RunsTableParams,
  options?: Omit<UseQueryOptions<RunsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.view);

  return useQuery<RunsTableResponse, AxiosError>({
    queryKey: GITEA_RUNS_TABLE_KEY(name, params),
    queryFn: () => getRunsTable(name, params),
    // Switching the workflow filter alters the query key; keeping the previous rows visible avoids a
    // skeleton flash
    placeholderData: keepPreviousData,
    // A run's status changes on the runner, not here
    staleTime: 0,
    // Polls only while the page still holds a run that can change. The fetch that turns the last one
    // terminal returns false, so the interval stops instead of hammering a finished list forever.
    refetchInterval: (query) =>
      query.state.data?.result.some((run) => run.isActive) ? ACTIVE_POLL_INTERVAL_MS : false,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
