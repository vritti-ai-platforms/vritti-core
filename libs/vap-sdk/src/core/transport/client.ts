import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { HttpLink } from '@apollo/client/link/http';
import type { RequestContext } from '../types';
import { PARTY_ID_HEADER } from './headers';

export interface VapClientOptions {
  endpoint: string;

  /**
   * How a request is authenticated — the one thing that differs by environment.
   *
   * A server passes a fetch that signs with the app credential; React Native passes one that attaches
   * a shopper session token. Everything else about the client is identical, which is what lets both
   * run the same documents against the same resolvers.
   */
  fetch: typeof fetch;

  /** Links to run before the terminating HTTP link — the response cache, on a server. */
  links?: ApolloLink[];
}

/**
 * The one client every domain operation runs through.
 *
 * Long-lived by design. Nothing is cached in memory to leak between organizations: `ApolloClient`
 * requires an `ApolloCache`, so it gets an `InMemoryCache` that every operation bypasses via
 * `no-cache`. It is inert — a store passed through `links` is the only cache that answers anything,
 * and it keys every entry by tenant.
 *
 * Per-request identity travels as Apollo *context* rather than being baked into the client, so one
 * client serves every caller and a UI can reuse it with its own fetch policies.
 */
export function createVapClient(options: VapClientOptions): ApolloClient {
  const contextLink = new SetContextLink((prevContext) => {
    const context = (prevContext.requestContext ?? {}) as RequestContext;
    return {
      headers: {
        ...prevContext.headers,
        ...(context.partyId ? { [PARTY_ID_HEADER]: context.partyId } : {}),
      },
    };
  });

  const http = new HttpLink({ uri: options.endpoint, fetch: options.fetch });

  // Order matters: anything in `links` sits in front of http so a cache hit never reaches the
  // network, and behind contextLink so its key can read the headers that identify the tenant.
  return new ApolloClient({
    link: ApolloLink.from([contextLink, ...(options.links ?? []), http]),
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
