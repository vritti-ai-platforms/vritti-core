import { Injectable } from '@nestjs/common';
import { CacheService } from '@vritti/api-sdk/cache';

const TTL_SECONDS = 5 * 60;
const PREFIX = 'bu:ctx';

interface BuContext {
  buTimezone: string;
  buCurrencyCode: string;
  buAncestorIds: string[];
  buDescendantIds: string[];
}

@Injectable()
export class BuContextCacheService {
  constructor(private readonly cache: CacheService) {}

  // Returns the cached context for a BU, or null on miss
  async get(buId: string): Promise<BuContext | null> {
    return this.cache.get<BuContext>(this.key(buId));
  }

  // Stores the resolved BU context with a TTL backstop
  async set(buId: string, value: BuContext): Promise<void> {
    await this.cache.set(this.key(buId), value, TTL_SECONDS);
  }

  // Drops the cached context for a single BU
  async invalidate(buId: string): Promise<void> {
    await this.cache.del(this.key(buId));
  }

  // Drops every cached BU context
  async invalidateAll(): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Builds the namespaced cache key
  private key(buId: string): string {
    return `${PREFIX}:${buId}`;
  }
}
