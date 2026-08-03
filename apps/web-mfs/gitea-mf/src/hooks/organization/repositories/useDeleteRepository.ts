import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteRepository } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORIES_TABLE_KEY } from './keys';

export function useDeleteRepository(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: deleteRepository,
    ...options,
    onSuccess: (...args) => {
      // The table only — NOT the GITEA_REPOSITORIES_KEY prefix, which also covers the deleted
      // repository's own detail query. That query is still mounted when this fires, so invalidating it
      // refetches straight into a 404; the caller navigates away instead.
      queryClient.invalidateQueries({ queryKey: GITEA_REPOSITORIES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
