import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { rerunRun } from '@/services/organization/actions.service';
import { GITEA_RUN_KEY, GITEA_RUN_LISTS_KEY } from './keys';

export function useRerunRun(
  name: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, number>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, number>({
    mutationFn: (runId) => rerunRun(name, runId),
    ...options,
    onSuccess: (data, runId, ...rest) => {
      queryClient.invalidateQueries({ queryKey: GITEA_RUN_LISTS_KEY(name) });
      // The run's own key covers its jobs, which is what a re-run resets; the refreshed jobs then flip
      // isActive back on, which is what restarts log tailing
      queryClient.invalidateQueries({ queryKey: GITEA_RUN_KEY(name, runId) });
      options?.onSuccess?.(data, runId, ...rest);
    },
  });
}
