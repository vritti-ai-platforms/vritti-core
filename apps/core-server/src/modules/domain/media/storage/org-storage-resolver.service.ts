import { Injectable } from '@nestjs/common';
import { R2StorageProvider, type StorageProvider } from '@vritti/api-sdk/storage';
import type { OrgStorage } from '@/db/schema';

// Bounded so a deployment with many tenants cannot accumulate an S3 client per org. Each entry holds an HTTPS agent
// and its connection pool, so this is memory and sockets, not just objects.
const MAX_CACHED_PROVIDERS = 100;

export interface ResolvedOrgStorage {
  storage: OrgStorage;
  provider: StorageProvider;
}

@Injectable()
export class OrgStorageResolverService {
  private readonly providers = new Map<string, StorageProvider>();

  // Builds the storage client for one org from its own credentials. Unlike a process-wide provider, every org gets a
  // client authenticated with a token scoped to just that org's buckets — the isolation is in the credential, so a
  // wrong bucket name cannot reach another tenant's objects.
  resolve(storage: OrgStorage): ResolvedOrgStorage {
    // Keyed on everything the client is built from, not the org id: a rotated key must not serve a client signed with
    // the revoked one, and enabling public access later changes publicUrl without touching the credential — a client
    // cached before that would keep throwing from getPublicUrl until it happened to be evicted.
    const key = `${storage.accountId}:${storage.accessKeyId}:${storage.publicUrl ?? ''}`;
    const cached = this.providers.get(key);
    if (cached) return { storage, provider: cached };

    const provider = this.create(storage);
    this.evictIfFull();
    this.providers.set(key, provider);
    return { storage, provider };
  }

  private create(storage: OrgStorage): StorageProvider {
    switch (storage.provider) {
      case 'r2':
        return new R2StorageProvider({
          accountId: storage.accountId,
          accessKeyId: storage.accessKeyId,
          secretAccessKey: storage.secretAccessKey,
          // Per-org, because R2 binds a public domain to one bucket; absent until public access was enabled, and
          // getPublicUrl throws rather than emitting a broken URL
          publicUrl: storage.publicUrl ?? undefined,
        });
      default:
        throw new Error(`Unsupported storage provider: ${storage.provider}`);
    }
  }

  // Plain FIFO eviction rather than true LRU: entries are interchangeable clients, so the cost of evicting a live one
  // is rebuilding it, not correctness
  private evictIfFull(): void {
    if (this.providers.size < MAX_CACHED_PROVIDERS) return;

    const oldest = this.providers.keys().next().value;
    if (oldest) this.providers.delete(oldest);
  }
}
