/**
 * Where operation results are cached, when a caller wants them cached.
 *
 * The interface is universal but every implementation is not: the one that ships lives in `server/`
 * and needs a Postgres pool. Declaring the shape here is what lets `VapSdkConfig` name it without
 * the core tier reaching into a tier that imports `pg` — a native bundle sees a type and nothing more.
 */
export interface ResponseCacheStore {
  /** The stored result, or null when absent or expired. Expiry is the store's business. */
  get(key: string): Promise<unknown | null>;
  set(key: string, result: unknown, ttlSeconds: number): Promise<void>;
  /** Drops every key under a prefix — the keys are prefixed by operation name. */
  invalidate(keyPrefix: string): Promise<void>;
}

/** What an operation asks for through Apollo context to opt into caching. */
export interface ResponseCacheContext {
  ttlSeconds: number;
}
