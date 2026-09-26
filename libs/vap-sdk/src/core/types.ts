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

  /**
   * The currency this storefront sells in, ISO 4217 — e.g. `INR`.
   *
   * Required by the basket and wishlist operations, which read a listing's price in it. Left
   * out deliberately rather than defaulted: a guessed currency finds no price for any listing the
   * catalogue does not carry in it, and the failure looks like an empty basket rather than a
   * misconfiguration. Nothing else in the SDK reads it.
   */
  currency?: string;

  /**
   * The site this storefront sells from, when it always sells from one.
   *
   * A default for every request, so a single-outlet shop configures it once instead of threading it
   * through every call. `forContext({ siteId })` overrides it — which is what a store selector does.
   */
  siteId?: string;

  /** The legal entity default, for a storefront that sells at LE rather than site level. */
  legalEntityId?: string;

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

  /**
   * The site the request acts at — which store's prices and stock answer it.
   *
   * Price is per listing × site × currency, so a storefront asking "what does this cost" is always
   * asking it of somewhere. A shop with one outlet sets it once from configuration; one with a
   * store selector sets it per request from what the shopper chose.
   *
   * Covered by the request signature, and the header **name** is signed too — so a request cannot
   * be re-pointed from one site to another, or from a site to a legal entity, in transit.
   */
  siteId?: string;

  /** The legal entity, for a storefront that sells at LE rather than site level. */
  legalEntityId?: string;
};
