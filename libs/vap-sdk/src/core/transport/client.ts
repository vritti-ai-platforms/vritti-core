import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { HttpLink } from '@apollo/client/link/http';
import type { RequestContext } from '../types.js';
import { LEGAL_ENTITY_ID_HEADER, PARTY_ID_HEADER, SITE_ID_HEADER } from './headers.js';

export interface VapClientOptions {
  endpoint: string;

  fetch: typeof fetch;

  links?: ApolloLink[];
}

// The one client every domain operation runs through.
export function createVapClient(options: VapClientOptions): ApolloClient {
  const contextLink = new SetContextLink((prevContext) => {
    const context = (prevContext.requestContext ?? {}) as RequestContext;
    return {
      headers: {
        ...prevContext.headers,
        ...(context.partyId ? { [PARTY_ID_HEADER]: context.partyId } : {}),
        // Read back off the outgoing headers by `createSignedFetch` and folded into the canonical, so the scope a
        // request claims is the scope it was signed for.
        ...(context.siteId ? { [SITE_ID_HEADER]: context.siteId } : {}),
        ...(context.legalEntityId ? { [LEGAL_ENTITY_ID_HEADER]: context.legalEntityId } : {}),
      },
    };
  });

  const http = new HttpLink({ uri: options.endpoint, fetch: options.fetch });

  // Order matters: anything in `links` sits in front of http so a cache hit never reaches the network, and behind
  // contextLink so its key can read the headers that identify the tenant.
  return new ApolloClient({
    link: ApolloLink.from([contextLink, ...(options.links ?? []), http]),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: 'no-cache' },
      mutate: { fetchPolicy: 'no-cache' },
    },
  });
}
