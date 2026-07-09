import { REVOKE_SESSION_MUTATION } from '../../graphql/account';
import type { MessageResponse } from '../../types/account';
import { type UseGqlMutationOptions, useGqlMutation } from '../useGqlMutation';

interface RevokeSessionResult {
  revokeSession: MessageResponse;
}

interface RevokeSessionVariables {
  sessionId: string;
}

type UseRevokeSessionOptions = Omit<UseGqlMutationOptions<RevokeSessionResult, RevokeSessionVariables>, 'mutation'>;

export function useRevokeSession(options?: UseRevokeSessionOptions) {
  return useGqlMutation<RevokeSessionResult, RevokeSessionVariables>(REVOKE_SESSION_MUTATION, {
    toast: {
      loadingMessage: 'Revoking session...',
      successMessage: 'Session revoked successfully',
    },
    // Evict the revoked session from the cached `sessions` list so the screen updates without a refetch.
    update: (cache, _result, { variables }) => {
      const sessionId = variables?.sessionId;
      if (!sessionId) return;
      const id = cache.identify({ __typename: 'UserSession', sessionId });
      if (id) cache.evict({ id });
      cache.gc();
    },
    ...options,
  });
}
