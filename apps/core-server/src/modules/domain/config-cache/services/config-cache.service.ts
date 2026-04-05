import https from 'node:https';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { FeatureCatalogEntry } from '@/db/schema';

interface OrgCacheEntry {
  bus: Map<string, FeatureCatalogEntry[]>;
  expiresAt: number;
}

@Injectable()
export class ConfigCacheService {
  private readonly logger = new Logger(ConfigCacheService.name);
  private readonly cache = new Map<string, OrgCacheEntry>();
  private readonly cloudApiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudApiUrl = this.configService.getOrThrow<string>('CLOUD_API_URL');
  }

  // Returns the feature catalog for a business unit, fetching from cloud if cache is stale or missing
  async getFeatureCatalog(orgId: string, buId: string): Promise<FeatureCatalogEntry[]> {
    const cached = this.cache.get(orgId);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.bus.get(buId) ?? [];
    }

    await this.fetchAndCache(orgId);
    return this.cache.get(orgId)?.bus.get(buId) ?? [];
  }

  // Removes a single org entry from the cache
  invalidate(orgId: string): void {
    this.cache.delete(orgId);
    this.logger.log(`Invalidated config cache for org ${orgId}`);
  }

  // Clears the entire cache
  invalidateAll(): void {
    this.cache.clear();
    this.logger.log('Invalidated entire config cache');
  }

  // Fetches the org config from cloud-server and stores it in cache
  private async fetchAndCache(orgId: string): Promise<void> {
    const url = `${this.cloudApiUrl}/license-api/config/${orgId}`;
    this.logger.log(`Fetching config from cloud: ${url}`);

    try {
      const response = await axios.get<{
        bus: Record<string, FeatureCatalogEntry[]>;
        expiresIn: number;
      }>(url, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      const { bus, expiresIn } = response.data;
      const busMap = new Map<string, FeatureCatalogEntry[]>(Object.entries(bus));

      this.cache.set(orgId, {
        bus: busMap,
        expiresAt: Date.now() + expiresIn * 1000,
      });

      this.logger.log(`Cached config for org ${orgId} — ${busMap.size} BU(s), expires in ${expiresIn}s`);
    } catch (error) {
      this.logger.error(`Failed to fetch config for org ${orgId}: ${error}`);
      throw error;
    }
  }
}
