// A stored response, and whether it is still inside its TTL. A stale one is never served while core answers — it is
// the fallback for when core cannot.
export interface CachedResponse {
  result: unknown;
  fresh: boolean;
}

export interface ResponseCacheStore {
  get(key: string): Promise<CachedResponse | null>;
  set(key: string, result: unknown, ttlSeconds: number): Promise<void>;
  // Expires every key starting with the prefix and returns how many. Expired, not deleted: each stays as a fallback.
  invalidate(keyPrefix: string): Promise<number>;
}

// What a domain operation puts on its Apollo context to be cached. No `ttlSeconds` means the SDK-wide default.
export interface ResponseCacheContext {
  ttlSeconds?: number;
}

// The cache context for an operation: the caller's TTL when it named one (`0` = never cached), else the default.
export function cacheFor(ttlSeconds?: number): ResponseCacheContext {
  return ttlSeconds === undefined ? {} : { ttlSeconds };
}
