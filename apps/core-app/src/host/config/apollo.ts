import type { ApolloClient } from '@apollo/client';
import { createApolloClient } from '@vritti/quantum-ui-native/apollo';
import { clearTokens, getOnSessionExpired, getStoredMobileBaseURL, getToken } from '@vritti/quantum-ui-native/utils';
import { Platform } from 'react-native';
import { ErrorCode } from '../types/error-code';
import { netInfoConnectivity } from './connectivity';
import { apolloCacheStore, getSelectedBusinessUnitId, offlineQueueStore } from './storage';

// The generic Apollo layer (link chain, normalized InMemoryCache, MMKV persistence) lives in
// @vritti/quantum-ui-native/apollo so every RN app reuses it. The host injects ONLY its session +
// transport behavior below; it owns NO micro-app schema. Each micro-app registers its own entity
// cache policies (relayStylePagination, by-id read redirects) at runtime via `registerConnection`,
// so the host cache stays schema-agnostic.
//
// Apollo runs ALONGSIDE TanStack Query during the GraphQL migration — it does NOT replace it.
// Secrets (access token, deployment base URL) stay in quantum-ui-native (in-memory token + Keychain
// base URL); proactive token refresh stays the timer inside the package. This client only reads those
// values per request; it never owns or refreshes the session.
const created = createApolloClient({
  getToken,
  resolveBaseURL: getStoredMobileBaseURL,
  // Tenant + platform headers mirror the axios request interceptor. Authorization is added by the
  // factory from the token.
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
  // Non-secret MMKV snapshot so the last-fetched data renders instantly on relaunch. Namespaced per BU
  // so each tenant keeps its own snapshot — switching BUs swaps snapshots (instant cold data both ways)
  // instead of overwriting one, and a relaunch rehydrates the currently-selected BU's data (no leak).
  persistence: { mmkv: apolloCacheStore, namespace: () => getSelectedBusinessUnitId() },
  // NetInfo drives replay-on-reconnect; the offline queue persists opted-in writes across app kills.
  // captureContext snapshots the active BU so each queued write replays under its original x-bu-id.
  connectivity: netInfoConnectivity,
  offline: {
    mmkv: offlineQueueStore,
    captureContext: (): Record<string, string> => {
      const businessUnitId = getSelectedBusinessUnitId();
      return businessUnitId ? { 'x-bu-id': businessUnitId } : {};
    },
  },
});

// `created.client` is typed against quantum-ui-native's own @apollo/client install; re-anchor it to
// this app's install (they are the SAME class at runtime — one Module-Federation singleton — but
// distinct nominal types across the two node_modules, so a direct assignment won't unify).
export const apolloClient = created.client as unknown as ApolloClient;
// Awaited at the App root (`use(apolloReady)`) so the persisted snapshot rehydrates before any query
// reads the cache.
export const apolloReady = created.ready;
// Logout / session-expiry: empty the live cache AND the persisted snapshot — no tenant data survives.
export const purgeApolloCache = created.purge;
// BU / tenant switch: purge ONLY the persisted snapshot; the active-query refetch keeps the live cache
// on screen (no blank flash) while preventing a relaunch from rehydrating the previous BU's rows.
export const purgeApolloPersisted = created.purgePersisted;
// BU / tenant switch: re-restore the NEW BU's namespaced snapshot into the live cache for instant cold
// data (a no-op on first visit to that BU). Paired with evictRegisteredConnections in PermissionProvider.
export const restoreApolloCache = created.restore;
// Lets the host observe how close the persisted snapshot is to the maxSize self-disable cliff.
export const getApolloCacheSize = created.getCacheSize;
