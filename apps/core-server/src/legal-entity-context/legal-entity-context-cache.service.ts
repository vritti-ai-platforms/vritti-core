import { Injectable } from '@nestjs/common';
import { CacheService } from '@vritti/api-sdk/cache';

const TTL_SECONDS = 5 * 60;
const PREFIX = 'le:ctx';

export interface LegalEntityContext {
  leCurrencyCode: string;
}

@Injectable()
export class LegalEntityContextCacheService {
  constructor(private readonly cache: CacheService) {}

  // Returns the cached context for a legal entity, or null on miss
  async get(legalEntityId: string): Promise<LegalEntityContext | null> {
    return this.cache.get<LegalEntityContext>(this.key(legalEntityId));
  }

  // Stores the resolved legal entity context with a TTL backstop
  async set(legalEntityId: string, value: LegalEntityContext): Promise<void> {
    await this.cache.set(this.key(legalEntityId), value, TTL_SECONDS);
  }

  // Drops the cached context for a single legal entity
  async invalidate(legalEntityId: string): Promise<void> {
    await this.cache.del(this.key(legalEntityId));
  }

  // Builds the namespaced cache key
  private key(legalEntityId: string): string {
    return `${PREFIX}:${legalEntityId}`;
  }
}
