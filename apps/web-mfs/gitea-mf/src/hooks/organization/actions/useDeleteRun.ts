import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteRun } from '@/services/organization/actions.service';
import { GITEA_RUN_LISTS_KEY } from './keys';

export function useDeleteRun(
  name: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, number>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, number>({
    mutationFn: (runId) => deleteRun(name, runId),
    ...options,
    onSuccess: (...args) => {
      // Lists only. The deleted run's own key is left alone on purpose: a caller viewing it is still
      // mounted at this point, so invalidating would refetch a run that no longer exists.
      queryClient.invalidateQueries({ queryKey: GITEA_RUN_LISTS_KEY(name) });
      options?.onSuccess?.(...args);
    },
  });
}
