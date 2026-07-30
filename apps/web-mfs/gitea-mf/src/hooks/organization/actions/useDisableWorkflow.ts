import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { disableWorkflow } from '@/services/organization/actions.service';
import { GITEA_WORKFLOWS_KEY } from './keys';

export function useDisableWorkflow(
  name: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (workflowId) => disableWorkflow(name, workflowId),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GITEA_WORKFLOWS_KEY(name) });
      options?.onSuccess?.(...args);
    },
  });
}
