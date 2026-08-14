import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { RunData } from '@/schemas/actions';
import { getRun } from '@/services/organization/actions.service';
import { ACTIVE_POLL_INTERVAL_MS, GITEA_RUN_KEY } from './keys';

// Fetches a run by id; suspends until data is available, so the run page's skeleton is its only loading
// state. Not self-gated on the view permission — useSuspenseQuery has no `enabled`; like useRepository it
// relies on the PermissionGate on the `:repoName` route to keep this guarded GET unmounted.
export function useRun(name: string, runId: number) {
  return useSuspenseQuery<RunData, AxiosError>({
    queryKey: GITEA_RUN_KEY(name, runId),
    queryFn: () => getRun(name, runId),
    staleTime: 0,
    // Stops as soon as the run reports a conclusion — a completed run never changes again
    refetchInterval: (query) => (query.state.data?.isActive ? ACTIVE_POLL_INTERVAL_MS : false),
  });
}
