import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type SuccessResponse, revokeSession } from '../../services/account/security.service';
import { SESSIONS_QUERY_KEY } from './useSessions';

type UseRevokeSessionOptions = Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>;

export function useRevokeSession(options?: UseRevokeSessionOptions) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: revokeSession,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
