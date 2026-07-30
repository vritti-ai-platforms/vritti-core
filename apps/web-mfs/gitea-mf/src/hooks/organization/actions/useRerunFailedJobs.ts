import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { rerunFailedJobs } from '@/services/organization/actions.service';
import { GITEA_RUN_KEY, GITEA_RUN_LISTS_KEY } from './keys';

export function useRerunFailedJobs(
  name: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, number>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, number>({
    mutationFn: (runId) => rerunFailedJobs(name, runId),
    ...options,
    onSuccess: (data, runId, ...rest) => {
      queryClient.invalidateQueries({ queryKey: GITEA_RUN_LISTS_KEY(name) });
      queryClient.invalidateQueries({ queryKey: GITEA_RUN_KEY(name, runId) });
      options?.onSuccess?.(data, runId, ...rest);
    },
  });
}
