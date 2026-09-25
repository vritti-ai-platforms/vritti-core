import { Injectable } from '@nestjs/common';
import { CacheService } from '@vritti/api-sdk/cache';

const TTL_SECONDS = 5 * 60;
const PREFIX = 'sitegroup:sites';

@Injectable()
export class SiteGroupContextCacheService {
  constructor(private readonly cache: CacheService) {}

  // Returns the cached member site ids for a group, or null on miss
  async get(groupId: string): Promise<string[] | null> {
    return this.cache.get<string[]>(this.key(groupId));
  }

  // Stores the resolved member site ids with a TTL backstop
  async set(groupId: string, siteIds: string[]): Promise<void> {
    await this.cache.set(this.key(groupId), siteIds, TTL_SECONDS);
  }

  // Drops the cached membership for a single group
  async invalidate(groupId: string): Promise<void> {
    await this.cache.del(this.key(groupId));
  }

  // Drops every cached group membership
  async invalidateAll(): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Builds the namespaced cache key
  private key(groupId: string): string {
    return `${PREFIX}:${groupId}`;
  }
}
