import { Injectable } from '@nestjs/common';
import { CacheService } from '@vritti/api-sdk/cache';

const TTL_SECONDS = 5 * 60;
const PREFIX = 'owner:name';

export type OwnerKind = 'org' | 'le' | 'site';

@Injectable()
export class OwnerNameCacheService {
  constructor(private readonly cache: CacheService) {}

  // Returns the names already cached, and the ids the caller still has to read from the database.
  // One MGET on Redis rather than a command per id.
  async getMany(kind: OwnerKind, ids: string[]): Promise<{ names: Map<string, string>; missing: string[] }> {
    const names = new Map<string, string>();
    const missing: string[] = [];
    if (ids.length === 0) return { names, missing };

    const hits = await this.cache.mget<string>(ids.map((id) => this.key(kind, id)));
    ids.forEach((id, index) => {
      const hit = hits[index];
      if (hit) names.set(id, hit);
      else missing.push(id);
    });

    return { names, missing };
  }

  // Caches the names just read, so the next request for them costs nothing. One pipelined write.
  async setMany(kind: OwnerKind, rows: { id: string; name: string }[]): Promise<void> {
    await this.cache.mset(
      rows.map((row) => ({ key: this.key(kind, row.id), value: row.name })),
      TTL_SECONDS,
    );
  }

  // Drops one cached name — called wherever an organization, legal entity or site is renamed
  async invalidate(kind: OwnerKind, id: string): Promise<void> {
    await this.cache.del(this.key(kind, id));
  }

  private key(kind: OwnerKind, id: string): string {
    return `${PREFIX}:${kind}:${id}`;
  }
}
