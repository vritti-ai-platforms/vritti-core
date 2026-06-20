import { ApolloClient, CombinedGraphQLErrors, from, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { relayStylePagination } from '@apollo/client/utilities';
import { clearTokens, getOnSessionExpired, getStoredMobileBaseURL, getToken } from '@vritti/quantum-ui-native/utils';
import { Platform } from 'react-native';
import { ErrorCode } from '../types/error-code';
import { getSelectedBusinessUnitId } from './storage';

// Apollo runs ALONGSIDE TanStack Query during the GraphQL migration — it does NOT replace it.
// Secrets (access token, deployment base URL) stay in quantum-ui-native (in-memory token +
// Keychain base URL); proactive token refresh stays the timer inside the package. This client
// only reads those values per request; it never owns or refreshes the session.

// Resolves headers + the per-request endpoint. The tenant base URL lives in the Keychain and is
// read async, so it's set on the context as `uri` (HttpLink honours a per-operation context uri)
// rather than the HttpLink constructor's static uri. Auth + tenant + platform headers mirror the
// axios request interceptor.
const authLink = new SetContextLink(async (prevContext) => {
  const baseURL = await getStoredMobileBaseURL();
  const token = getToken();
  const businessUnitId = getSelectedBusinessUnitId();

  const headers: Record<string, string> = {
    ...prevContext.headers,
    'X-Platform': Platform.OS,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (businessUnitId) headers['x-bu-id'] = businessUnitId;

  return {
    headers,
    ...(baseURL ? { uri: `${baseURL}/graphql` } : {}),
  };
});

// On UNAUTHENTICATED, clear the session and notify the host (mirrors the axios 401 path). All
// other errors pass through untouched for callers / useGqlMutation to surface.
const errorLink = new ErrorLink(({ error }) => {
  if (!CombinedGraphQLErrors.is(error)) return;

  for (const graphQLError of error.errors) {
    if (graphQLError.extensions?.code === ErrorCode.UNAUTHENTICATED) {
      void clearTokens().finally(() => getOnSessionExpired()?.());
      return;
    }
  }
});

// Falls back to a relative /graphql when no Keychain base URL is stored yet; authLink overrides
// this with the tenant-specific endpoint on every request once a deployment is selected.
const httpLink = new HttpLink({ uri: '/graphql' });

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    // relayStylePagination merges paginated Relay connections directly in the cache — the hook no
    // longer needs a manual updateQuery, and create/delete cache surgery (cache.modify/evict) works
    // cleanly on the connection. keyArgs = filters/search/sort → each filter combo is its own cached
    // connection; the pagination args (first/after) are excluded. The field name is a remote's query
    // (commerce-ma's `inventoryItems`) — the only coupling the host cache takes on.
    typePolicies: {
      Query: {
        fields: {
          inventoryItems: relayStylePagination(['filters', 'search', 'sort']),
          // Cache redirect: resolve the single-item query from the normalized entity the feed already
          // cached (same InventoryItemFields fragment), so the detail/edit screens read it with NO
          // network round-trip. After a delete evicts the entity this yields a dangling ref →
          // cache-only returns null → still no refetch (no findById on a deleted id).
          inventoryItem: {
            read(_existing, { args, toReference }) {
              return args?.id ? toReference({ __typename: 'InventoryItem', id: args.id as string }) : undefined;
            },
          },
        },
      },
    },
  }),
  link: from([errorLink, authLink, httpLink]),
});
