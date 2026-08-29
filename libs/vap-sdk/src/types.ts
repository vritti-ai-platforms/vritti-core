import type { ResponseCacheStore } from './apollo/response-cache';

/**
 * A failure the caller should surface.
 *
 * Shared by every domain — an appointment that cannot be booked and an identity
 * that cannot be created come back the same shape, so a caller handles them in
 * one place.
 */
export class VapError extends Error {
  constructor(
    message: string,
    /** Core's error label, e.g. `Unknown Client`. */
    readonly code: string | undefined,
    /** HTTP-equivalent status, when core supplied one. */
    readonly status: number | undefined,
  ) {
    super(message);
    this.name = 'VapError';
  }
}

/**
 * Core refused, **and** undoing the local record failed too.
 *
 * The state this reports is the one worth interrupting for: an account that can
 * sign in with nothing behind it in commerce. The shopper will get all the way to
 * checkout before anything looks wrong, so a caller should log this loudly and
 * tell them to sign in rather than inviting a retry that will now say their email
 * is taken.
 *
 * Distinct from a plain `VapError`, which means core refused and the local record
 * was cleanly removed — nothing left anywhere, safe to retry.
 */
export class PartyRollbackError extends Error {
  constructor(
    /** The local record that could not be removed. */
    readonly localId: string | number,
    /** Why core refused. */
    readonly cause: unknown,
    /** Why the undo failed. */
    readonly rollbackError: unknown,
  ) {
    super(
      `Registration failed and the local record ${localId} could not be rolled back — ` +
        'it now exists without a commerce party.',
    );
    this.name = 'PartyRollbackError';
  }
}

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
