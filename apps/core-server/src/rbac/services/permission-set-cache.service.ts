import { Injectable } from '@nestjs/common';
import { CacheService } from '@vritti/api-sdk/cache';
import type { PlatformBucket } from '@vritti/api-sdk/catalog-resolver';

const TTL_SECONDS = 5 * 60;
const PREFIX = 'perm';

// Caches a user's enabled-permission code set per BU per platform bucket, backed by the api-sdk
// CacheService (LRU in-memory today; swap the module's driver to 'redis' when core-server scales out).
// Web and mobile resolve to different feature sets, so the platform is part of the key.
@Injectable()
export class PermissionSetCacheService {
  constructor(private readonly cache: CacheService) {}

  // Returns the cached enabled set for a user at a BU on a platform, or null on miss
  async get(userId: string, buId: string, platform: PlatformBucket): Promise<Set<string> | null> {
    const codes = await this.cache.get<string[]>(this.key(userId, buId, platform));
    return codes ? new Set(codes) : null;
  }

  // Stores the enabled set (serialized as codes) with a TTL backstop
  async set(userId: string, buId: string, platform: PlatformBucket, codes: Set<string>): Promise<void> {
    await this.cache.set(this.key(userId, buId, platform), [...codes], TTL_SECONDS);
  }

  // Drops the cached set for a single user at a BU across every platform bucket
  async invalidate(userId: string, buId: string): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:${userId}:${buId}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Drops every cached set belonging to a BU (all users, all platforms)
  async invalidateByBu(buId: string): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:*:${buId}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Drops every cached permission set
  async invalidateAll(): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Builds the namespaced composite cache key
  private key(userId: string, buId: string, platform: PlatformBucket): string {
    return `${PREFIX}:${userId}:${buId}:${platform}`;
  }
}
