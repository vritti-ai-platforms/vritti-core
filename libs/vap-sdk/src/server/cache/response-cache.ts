import { createHash } from 'node:crypto';
import { ApolloLink, Observable } from '@apollo/client';
import { WORKSPACE_HEADER_ORDER } from '../signing';
import { PARTY_ID_HEADER } from '../../core/transport/headers';
import type { ResponseCacheContext, ResponseCacheStore } from '../../core/transport/response-cache-store';

/**
 * Where cached operation results live.
 *
 * The consumer implements this — vap-sdk never opens a connection or owns a table, so it needs no
 * database driver and no migration of its own, and a caller with nowhere to cache simply omits it.
 * Mirrors how the mobile host injects MMKV into the Apollo layer.
 *
 * Postgres cannot be Apollo's *cache*: `ApolloCache.read` and `diff` are synchronous. It can be a
 * response cache in front of the network, which is what this is.
 */

/**
 * Serves whole operation results from the store, keyed per tenant and scope.
 *
 * **Opt-in per operation, never blanket.** An operation caches only when it passes
 * `context: { responseCache: { ttlSeconds } }`, which keeps a latency optimisation from quietly
 * becoming a correctness problem — the identity lookup in `register` must never be cached, because a
 * stale "nobody found" would create a duplicate party.
 *
 * Mutations are never read from or written to the store, whatever their context says.
 */
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
            // Only a clean result is worth keeping — caching a partial one would serve those errors
            // again for the whole TTL.
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

/**
 * Identity of a cached result.
 *
 * Carries the tenant and the scope, not just the query: `clientId` is what identifies the
 * organization client-side (core derives it from the credential), and the party changes
 * what the same query returns. Leaving either out would serve one shopper's or one site's data to
 * another.
 *
 * The operation name leads the key so `invalidate` can drop one operation's entries by prefix.
 */
function cacheKey(clientId: string, operation: Parameters<ApolloLink['request']>[0]): string {
  const headers = (operation.getContext().headers ?? {}) as Record<string, string>;
  const scope = WORKSPACE_HEADER_ORDER.map((name) => `${name}=${headers[name] ?? ''}`).join('&');
  const identity = JSON.stringify([clientId, headers[PARTY_ID_HEADER] ?? '', scope, operation.variables ?? {}]);
  return `${operation.operationName}:${createHash('sha256').update(identity).digest('hex')}`;
}

function isMutation(query: Parameters<ApolloLink['request']>[0]['query']): boolean {
  return query.definitions.some((d) => d.kind === 'OperationDefinition' && d.operation === 'mutation');
}
