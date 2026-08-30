import type { ResponseCacheStore } from './transport/response-cache-store';

export type VapSdkConfig = {
  /** Where core's GraphQL lives. Absolute — these calls are made server-side. */
  endpoint: string;

  /**
   * The app credential identifying this client to core.
   *
   * Server-side only. The secret is an Ed25519 private key that signs every request, so a browser
   * that could read it could act as this client against its whole organization.
   */
  clientId: string;
  clientSecret: string;

  /** Overridable for tests. Defaults to the global `fetch`. */
  fetch?: typeof fetch;

  /**
   * Where to cache operation results, when you want them cached.
   *
   * Supplied by the caller so this package owns no database driver, no connection pool and no
   * migration — a Postgres-backed implementation lives in the app that already has a pool. Omit it and
   * nothing is cached, which is what a browser-side caller would do.
   *
   * Caching is still opt-in per operation on top of this; providing a store only makes it possible.
   */
  responseCache?: ResponseCacheStore;
};

/**
 * What a request acts as.
 *
 * Just the party today. It stays a named type rather than a bare `partyId` argument because it is
 * covered by the request signature, so anything added here changes the canonical and has to change
 * in core's verifier at the same time.
 */
export type RequestContext = {
  /** The party the app is acting for — a signed-in shopper, typically. */
  partyId?: string;
};
