import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { HttpLink } from '@apollo/client/link/http';
import type { VapSdkConfig } from '../types';
import type { RequestContext } from '../workspaces/types';
import { workspaceHeaders } from '../workspaces/types';
import { createResponseCacheLink } from './response-cache';
import { createSignedFetch, PARTY_ID_HEADER } from './signed-fetch';

/**
 * The one client every domain operation runs through.
 *
 * Long-lived by design. Nothing is cached in memory to leak between organizations: `ApolloClient`
 * requires an `ApolloCache`, so it gets an `InMemoryCache` that every operation bypasses via
 * `no-cache`. It is inert — Postgres, through the response-cache link, is the only cache that answers
 * anything, and it keys every entry by tenant.
 *
 * Per-request identity therefore travels as Apollo *context* rather than being baked into the client,
 * which is also what lets a future UI reuse this with its own fetch policies.
 */
export function createSignedClient(config: VapSdkConfig): ApolloClient {
  const contextLink = new SetContextLink((prevContext) => {
    const context = (prevContext.requestContext ?? {}) as RequestContext;
    return {
      headers: {
        ...prevContext.headers,
        ...(context.partyId ? { [PARTY_ID_HEADER]: context.partyId } : {}),
        ...workspaceHeaders(context.workspace),
      },
    };
  });

  const http = new HttpLink({ uri: config.endpoint, fetch: createSignedFetch(config) });

  // Order matters: the cache link sits in front of http so a hit never reaches the network, and
  // behind contextLink so its key can read the headers that identify the tenant and scope.
  const links = config.responseCache
    ? [contextLink, createResponseCacheLink(config.responseCache, config.clientId), http]
    : [contextLink, http];

  return new ApolloClient({
    link: ApolloLink.from(links),
    cache: new InMemoryCache(),
    // `no-cache` is what makes the InMemoryCache above inert. errorPolicy is left at its default
    // ('none' — throw on any GraphQL error), which is what the VapError mapper expects; declaring it
    // here would require Apollo v4's DeclareDefaultOptions augmentation for no behavioural gain.
    defaultOptions: {
      query: { fetchPolicy: 'no-cache' },
      mutate: { fetchPolicy: 'no-cache' },
    },
  });
}
