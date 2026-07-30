import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { DispatchWorkflowData, RunData } from '@/schemas/actions';
import { dispatchWorkflow } from '@/services/organization/actions.service';
import { GITEA_RUN_LISTS_KEY } from './keys';

type Options = Omit<UseMutationOptions<RunData | null, AxiosError, DispatchWorkflowData>, 'mutationFn'>;

export function useDispatchWorkflow(name: string, workflowId: string, options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<RunData | null, AxiosError, DispatchWorkflowData>({
    mutationFn: (data) => dispatchWorkflow(name, workflowId, data),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GITEA_RUN_LISTS_KEY(name) });
      options?.onSuccess?.(...args);
    },
  });
}
