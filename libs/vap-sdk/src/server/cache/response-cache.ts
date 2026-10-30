import { createHash } from 'node:crypto';
import { ApolloLink, Observable } from '@apollo/client';
import { PARTY_ID_HEADER } from '../../core/transport/headers.js';
import type { ResponseCacheContext, ResponseCacheStore } from '../../core/transport/response-cache-store.js';
import { WORKSPACE_HEADER_ORDER } from '../signing.js';

export const DEFAULT_RESPONSE_CACHE_TTL_SECONDS = 60;

// How long, after core fails, stale responses are served without asking it again. Short on purpose: it bounds how
// long the site keeps showing old data once core is back, and spares every request core's timeout while it is not.
const CORE_RETRY_MS = 30_000;

export interface ResponseCacheLinkOptions {
  // TTL for an operation that opts into caching without naming one.
  defaultTtlSeconds?: number;
}

type LinkResult = ApolloLink.Result;

// Serves whole operation results from the store, keyed per tenant and scope. A fresh one is served without asking
// core; a stale one is refreshed from core — and served as it is if core cannot answer, for as long as core cannot.
export function createResponseCacheLink(
  store: ResponseCacheStore,
  clientId: string,
  options: ResponseCacheLinkOptions = {},
): ApolloLink {
  const defaultTtlSeconds = options.defaultTtlSeconds ?? DEFAULT_RESPONSE_CACHE_TTL_SECONDS;
  // Shared by every operation through this client: one failure is enough to know core is down.
  let coreDownUntil = 0;

  return new ApolloLink((operation, forward) => {
    const cacheContext = operation.getContext().responseCache as ResponseCacheContext | undefined;
    if (!cacheContext || isMutation(operation.query)) return forward(operation);

    const ttlSeconds = cacheContext.ttlSeconds ?? defaultTtlSeconds;
    if (ttlSeconds <= 0) return forward(operation);

    const key = cacheKey(clientId, operation);

    return new Observable<LinkResult>((observer) => {
      let cancelled = false;
      let subscription: { unsubscribe(): void } | undefined;

      const serve = (result: LinkResult) => {
        if (cancelled) return;
        observer.next(result);
        observer.complete();
      };

      const askCore = (stale: LinkResult | null) => {
        if (cancelled) return;
        let answered = false;
        const coreFailed = (onNoFallback: () => void) => {
          coreDownUntil = Date.now() + CORE_RETRY_MS;
          if (stale) serve(stale);
          else onNoFallback();
        };

        subscription = forward(operation).subscribe({
          next: (result) => {
            if (answered) return;
            answered = true;
            // Errors and no data is core failing to answer — the commerce service behind it down, say — and is
            // treated like a network error. A partial result is core's answer and goes through, uncached.
            if (result.errors?.length && result.data == null) {
              coreFailed(() => serve(result));
              return;
            }
            coreDownUntil = 0;
            if (!result.errors?.length) void store.set(key, result, ttlSeconds).catch(() => undefined);
            serve(result);
          },
          error: (error) => {
            if (answered) return;
            answered = true;
            coreFailed(() => observer.error(error));
          },
          complete: () => {
            if (!answered) observer.complete();
          },
        });
      };

      store
        .get(key)
        .then((cached) => {
          if (cancelled) return;
          const result = (cached?.result ?? null) as LinkResult | null;
          if (result && cached?.fresh) return serve(result);
          // Core failed moments ago: serve what there is rather than wait out its timeout again.
          if (result && Date.now() < coreDownUntil) return serve(result);
          askCore(result);
        })
        // A cache that is down must not take the request with it.
        .catch(() => askCore(null));

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
