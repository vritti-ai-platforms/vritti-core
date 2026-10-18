export interface ResponseCacheStore {
  get(key: string): Promise<unknown | null>;
  set(key: string, result: unknown, ttlSeconds: number): Promise<void>;
  invalidate(keyPrefix: string): Promise<void>;
}

export interface ResponseCacheContext {
  ttlSeconds: number;
}
