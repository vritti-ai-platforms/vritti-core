import type { ApolloClient } from '@apollo/client';
import { createApolloClient } from '@vritti/quantum-ui-native/apollo';
import { clearTokens, getOnSessionExpired, getStoredMobileBaseURL, getToken } from '@vritti/quantum-ui-native/utils';
import { Platform } from 'react-native';
import { ErrorCode } from '../types/error-code';
import { netInfoConnectivity } from './connectivity';
import { getSelectedBusinessUnitId, offlineQueueStore } from './storage';

const created = createApolloClient({
  getToken,
  resolveBaseURL: getStoredMobileBaseURL,
  // Tenant + platform headers mirror the axios interceptor; Authorization is added from the token.
  buildHeaders: () => {
    const businessUnitId = getSelectedBusinessUnitId();
    return {
      'X-Platform': Platform.OS,
      ...(businessUnitId ? { 'x-bu-id': businessUnitId } : {}),
    };
  },
  // On UNAUTHENTICATED, clear the session and notify the host (mirrors the axios 401 path).
  onUnauthenticated: () => {
    void clearTokens().finally(() => getOnSessionExpired()?.());
  },
  unauthenticatedCode: ErrorCode.UNAUTHENTICATED,
  // Ephemeral cache: no MMKV snapshot — every cold launch starts empty and fetches fresh.
  // Pin cache-and-network explicitly: WITHOUT `persistence` the factory default silently flips to
  // Apollo's cache-first, which would stop watch queries revalidating on mount within a session.
  watchQueryFetchPolicy: 'cache-and-network',
  // NetInfo drives replay-on-reconnect; the offline queue persists opted-in writes across app kills.
  connectivity: netInfoConnectivity,
  offline: {
    mmkv: offlineQueueStore,
    captureContext: (): Record<string, string> => {
      const businessUnitId = getSelectedBusinessUnitId();
      return businessUnitId ? { 'x-bu-id': businessUnitId } : {};
    },
  },
});

export const apolloClient = created.client as unknown as ApolloClient;
export const apolloReady = created.ready;
export const purgeApolloCache = created.purge;
export const purgeApolloPersisted = created.purgePersisted;
// BU / tenant switch: re-restore the NEW BU's namespaced snapshot into the live cache for instant cold
// data (a no-op on first visit to that BU). Paired with evictRegisteredConnections in PermissionProvider.
export const restoreApolloCache = created.restore;
// Lets the host observe how close the persisted snapshot is to the maxSize self-disable cliff.
export const getApolloCacheSize = created.getCacheSize;
