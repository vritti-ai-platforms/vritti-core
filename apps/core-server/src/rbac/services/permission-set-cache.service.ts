import { Injectable } from '@nestjs/common';
import { CacheService } from '@vritti/api-sdk/cache';
import type { PlatformBucket } from '@vritti/api-sdk/catalog-resolver';
import type { PermissionContext } from '@/modules/domain/user-permissions/services/user-permissions.service';

const TTL_SECONDS = 5 * 60;
const PREFIX = 'perm:user:ctx';

@Injectable()
export class PermissionSetCacheService {
  constructor(private readonly cache: CacheService) {}

  // Returns the cached enabled set for a user in a workspace context on a platform, or null on miss
  async get(userId: string, ctx: PermissionContext, platform: PlatformBucket): Promise<Set<string> | null> {
    const codes = await this.cache.get<string[]>(this.key(userId, ctx, platform));
    return codes ? new Set(codes) : null;
  }

  // Stores the enabled set (serialized as codes) with a TTL backstop
  async set(userId: string, ctx: PermissionContext, platform: PlatformBucket, codes: Set<string>): Promise<void> {
    await this.cache.set(this.key(userId, ctx, platform), [...codes], TTL_SECONDS);
  }

  // Drops the cached set for a single user in a workspace context across every platform bucket
  async invalidate(userId: string, ctx: PermissionContext): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:${userId}:${ctx.scope}:${ctx.id}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Drops every cached set for a user (group/LE/org-target assignments affect many contexts)
  async invalidateByUser(userId: string): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:${userId}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Drops every cached set belonging to a site (all users, all platforms)
  async invalidateBySite(siteId: string): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:*:SITE:${siteId}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Drops every cached permission set
  async invalidateAll(): Promise<void> {
    const keys = await this.cache.scanKeys(`${PREFIX}:*`);
    if (keys.length) await this.cache.del(...keys);
  }

  // Builds the namespaced composite cache key including the workspace scope and node id
  private key(userId: string, ctx: PermissionContext, platform: PlatformBucket): string {
    return `${PREFIX}:${userId}:${ctx.scope}:${ctx.id}:${platform}`;
  }
}
