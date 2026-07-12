import type { ApolloClient } from '@apollo/client';
import { createApolloClient } from '@vritti/quantum-ui-native/apollo';
import { clearTokens, getOnSessionExpired, getStoredMobileBaseURL, getToken } from '@vritti/quantum-ui-native/utils';
import { Platform } from 'react-native';
import { ErrorCode } from '../types/error-code';
import { netInfoConnectivity } from './connectivity';
import { apolloCacheStore, getActiveWorkspaceHeader, offlineQueueStore } from './storage';

const created = createApolloClient({
  getToken,
  resolveBaseURL: getStoredMobileBaseURL,
  // Tenant + platform headers mirror the axios interceptor; Authorization is added from the token.
  // The active workspace resolves to exactly one context header (x-site-id / x-sg-id / x-le-id / x-org-id).
  buildHeaders: () => ({
    'X-Platform': Platform.OS,
    ...getActiveWorkspaceHeader(),
  }),
  // On UNAUTHENTICATED, clear the session and notify the host (mirrors the axios 401 path).
  onUnauthenticated: () => {
    void clearTokens().finally(() => getOnSessionExpired()?.());
  },
  unauthenticatedCode: ErrorCode.UNAUTHENTICATED,
  // Non-secret MMKV snapshot so the last-fetched data renders instantly on relaunch.
  persistence: { mmkv: apolloCacheStore },
  // NetInfo drives replay-on-reconnect; the offline queue persists opted-in writes across app kills.
  connectivity: netInfoConnectivity,
  offline: {
    mmkv: offlineQueueStore,
    captureContext: (): Record<string, string> => getActiveWorkspaceHeader(),
  },
});

export const apolloClient = created.client as unknown as ApolloClient;
export const apolloReady = created.ready;
export const purgeApolloCache = created.purge;
export const purgeApolloPersisted = created.purgePersisted;
