import { createHash } from 'node:crypto';
import { ApolloLink, Observable } from '@apollo/client';
import { PARTY_ID_HEADER } from '../../core/transport/headers.js';
import type { ResponseCacheContext, ResponseCacheStore } from '../../core/transport/response-cache-store.js';
import { WORKSPACE_HEADER_ORDER } from '../signing.js';

// Where cached operation results live.

// Serves whole operation results from the store, keyed per tenant and scope.
export function createResponseCacheLink(store: ResponseCacheStore, clientId: string): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const cacheContext = operation.getContext().responseCache as ResponseCacheContext | undefined;
    if (!cacheContext || isMutation(operation.query)) return forward(operation);

    const key = cacheKey(clientId, operation);

    return new Observable((observer) => {
      let cancelled = false;
      let subscription: { unsubscribe(): void } | undefined;

      const fetchAndStore = () => {
        if (cancelled) return;
        subscription = forward(operation).subscribe({
          next: (result) => {
            // Only a clean result is worth keeping — caching a partial one would serve those errors again for the whole
            // TTL.
            if (!result.errors?.length) {
              void store.set(key, result, cacheContext.ttlSeconds).catch(() => undefined);
            }
            observer.next(result);
          },
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        });
      };

      store
        .get(key)
        .then((hit) => {
          if (cancelled) return;
          if (hit) {
            observer.next(hit as Parameters<typeof observer.next>[0]);
            observer.complete();
            return;
          }
          fetchAndStore();
        })
        // A cache that is down must not take the request with it.
        .catch(fetchAndStore);

      return () => {
        cancelled = true;
        subscription?.unsubscribe();
      };
    });
  });
}

// Identity of a cached result.
function cacheKey(clientId: string, operation: Parameters<ApolloLink['request']>[0]): string {
  const headers = (operation.getContext().headers ?? {}) as Record<string, string>;
  const scope = WORKSPACE_HEADER_ORDER.map((name) => `${name}=${headers[name] ?? ''}`).join('&');
  const identity = JSON.stringify([clientId, headers[PARTY_ID_HEADER] ?? '', scope, operation.variables ?? {}]);
  return `${operation.operationName}:${createHash('sha256').update(identity).digest('hex')}`;
}

function isMutation(query: Parameters<ApolloLink['request']>[0]['query']): boolean {
  return query.definitions.some((d) => d.kind === 'OperationDefinition' && d.operation === 'mutation');
}
