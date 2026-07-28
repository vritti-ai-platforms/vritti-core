import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@/schemas/common';
import { deleteRepository } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORIES_KEY } from './keys';

export function useDeleteRepository(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: deleteRepository,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GITEA_REPOSITORIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
