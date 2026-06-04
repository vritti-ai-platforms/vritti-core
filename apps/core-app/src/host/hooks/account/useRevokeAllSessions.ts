import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type SuccessResponse, revokeAllSessions } from '../../services/account/security.service';
import { SESSIONS_QUERY_KEY } from './useSessions';

type UseRevokeAllSessionsOptions = Omit<UseMutationOptions<SuccessResponse, AxiosError, void>, 'mutationFn'>;

export function useRevokeAllSessions(options?: UseRevokeAllSessionsOptions) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, void>({
    mutationFn: revokeAllSessions,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
