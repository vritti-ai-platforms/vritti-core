import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { RunsTableParams, RunsTableResponse } from '@/schemas/actions';
import { getRunsTable } from '@/services/organization/actions.service';
import { GITEA_RUNS_TABLE_KEY } from './keys';

// Fetches the workflow runs table. The key carries the workflow filter but no page: the server reads
// the pushed table state, so a page change is an invalidation of the same key.
export function useRuns(
  name: string,
  params: RunsTableParams,
  options?: Omit<UseQueryOptions<RunsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_REPOSITORIES.actions.runs.view);

  return useQuery<RunsTableResponse, AxiosError>({
    queryKey: GITEA_RUNS_TABLE_KEY(name, params),
    queryFn: () => getRunsTable(name, params),
    // Switching the workflow filter alters the query key; keeping the previous rows visible avoids a
    // skeleton flash
    placeholderData: keepPreviousData,
    // A run's status changes on the runner, not here
    staleTime: 0,
    // Deliberately no refetchInterval: a queued run that no runner ever picks up would poll forever.
    // The table refreshes on demand (its toolbar button) and after any run mutation invalidates the list.
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
