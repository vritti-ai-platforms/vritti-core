import { Injectable } from '@nestjs/common';
import { CacheService } from '@vritti/api-sdk/cache';

const TTL_SECONDS = 5 * 60;
const PREFIX = 'site:ctx';

interface SiteContext {
  siteTimezone: string;
  siteCurrencyCode: string;
}

@Injectable()
export class SiteContextCacheService {
  constructor(private readonly cache: CacheService) {}

  // Returns the cached context for a site, or null on miss
  async get(siteId: string): Promise<SiteContext | null> {
    return this.cache.get<SiteContext>(this.key(siteId));
  }

  // Stores the resolved site context with a TTL backstop
  async set(siteId: string, value: SiteContext): Promise<void> {
    await this.cache.set(this.key(siteId), value, TTL_SECONDS);
  }

  // Drops the cached context for a single site
  async invalidate(siteId: string): Promise<void> {
    await this.cache.del(this.key(siteId));
  }

  // Drops every cached site context
  async invalidateAll(): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Builds the namespaced cache key
  private key(siteId: string): string {
    return `${PREFIX}:${siteId}`;
  }
}
