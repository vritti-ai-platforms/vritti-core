import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@services/account/security.service';
import { revokeAllSessions } from '@services/account/security.service';
import { SESSIONS_QUERY_KEY } from './useSessions';

export function useRevokeAllSessions(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, void>, 'mutationFn'>,
) {
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
