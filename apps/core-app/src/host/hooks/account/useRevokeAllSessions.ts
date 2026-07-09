import type { OperationVariables } from '@apollo/client';
import { REVOKE_ALL_SESSIONS_MUTATION, SESSIONS_QUERY } from '../../graphql/account';
import type { MessageResponse } from '../../types/account';
import { type UseGqlMutationOptions, useGqlMutation } from '../useGqlMutation';

interface RevokeAllSessionsResult {
  revokeAllSessions: MessageResponse;
}

type UseRevokeAllSessionsOptions = Omit<UseGqlMutationOptions<RevokeAllSessionsResult, OperationVariables>, 'mutation'>;

export function useRevokeAllSessions(options?: UseRevokeAllSessionsOptions) {
  return useGqlMutation<RevokeAllSessionsResult, OperationVariables>(REVOKE_ALL_SESSIONS_MUTATION, {
    toast: {
      loadingMessage: 'Signing out all devices...',
      successMessage: 'Signed out from all other devices',
    },
    // Refetch `sessions` so the cached list reflects the single surviving session.
    refetchQueries: [{ query: SESSIONS_QUERY }],
    ...options,
  });
}
