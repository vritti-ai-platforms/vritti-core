import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateResponse } from '@/schemas/common';
import type { CreateRepositoryData, RepositoryData } from '@/schemas/repositories';
import { createRepository } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORIES_KEY } from './keys';

type Options = Omit<UseMutationOptions<CreateResponse<RepositoryData>, AxiosError, CreateRepositoryData>, 'mutationFn'>;

export function useCreateRepository(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<RepositoryData>, AxiosError, CreateRepositoryData>({
    mutationFn: createRepository,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GITEA_REPOSITORIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
