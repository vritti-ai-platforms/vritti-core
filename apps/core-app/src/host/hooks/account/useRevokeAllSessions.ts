import { gql, type OperationVariables } from '@apollo/client';
import type { MessageResponse } from '../../types/account';
import { type UseGqlMutationOptions, useGqlMutation } from '../useGqlMutation';
import { SESSIONS_QUERY } from './useSessions';

export const REVOKE_ALL_SESSIONS_MUTATION = gql`
  mutation RevokeAllSessions {
    revokeAllSessions {
      success
      message
    }
  }
`;

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
    // Revoking all sessions drops every session except the current one. Refetch `sessions` so
    // the cached list reflects the single surviving session rather than guessing which to evict.
    refetchQueries: [{ query: SESSIONS_QUERY }],
    ...options,
  });
}
