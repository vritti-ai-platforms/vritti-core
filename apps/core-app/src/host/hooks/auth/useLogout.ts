import { clearTokens, getOnSessionExpired } from '@vritti/quantum-ui-native/utils';
import { purgeApolloCache } from '../../config/apollo';
import { MOBILE_LOGOUT } from '../../graphql/auth';
import type { MessageResponse } from '../../graphql/generated/graphql';
import { type UseGqlMutationOptions, useGqlMutation } from '../useGqlMutation';

interface MobileLogoutData {
  mobileLogout: MessageResponse;
}

type UseLogoutOptions = Omit<UseGqlMutationOptions<MobileLogoutData, Record<string, never>>, 'mutation'>;

// Logs out over GraphQL, then tears down the session: clears the Keychain tokens, notifies the
// host (mirrors the axios path), and resets Apollo's store so no tenant-scoped cache survives.
export function useLogout(options?: UseLogoutOptions) {
  return useGqlMutation<MobileLogoutData, Record<string, never>>(MOBILE_LOGOUT, {
    ...options,
    onCompleted: async (data, clientOptions) => {
      await clearTokens();
      await purgeApolloCache();
      getOnSessionExpired()?.();
      options?.onCompleted?.(data, clientOptions);
    },
  });
}
