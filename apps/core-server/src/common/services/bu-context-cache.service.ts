import { Injectable, Logger } from '@nestjs/common';

const TTL_MS = 5 * 60 * 1000;

interface BuContextEntry {
  buTimezone: string;
  buAncestorIds: string[];
  buDescendantIds: string[];
  expiresAt: number;
}

@Injectable()
export class BuContextCacheService {
  private readonly logger = new Logger(BuContextCacheService.name);
  private readonly cache = new Map<string, BuContextEntry>();

  get(buId: string): Omit<BuContextEntry, 'expiresAt'> | null {
    const entry = this.cache.get(buId);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return { buTimezone: entry.buTimezone, buAncestorIds: entry.buAncestorIds, buDescendantIds: entry.buDescendantIds };
  }

  set(buId: string, value: Omit<BuContextEntry, 'expiresAt'>): void {
    this.cache.set(buId, { ...value, expiresAt: Date.now() + TTL_MS });
  }

  invalidate(buId: string): void {
    this.cache.delete(buId);
    this.logger.debug(`Invalidated BU context cache for ${buId}`);
  }
}
