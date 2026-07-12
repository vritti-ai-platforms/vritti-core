import { SiteRepository } from '@domain/site/repositories/site.repository';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { type SiteContext, SiteContextCacheService } from './site-context-cache.service';

@Injectable()
export class SiteContextResolverService {
  constructor(
    private readonly cache: SiteContextCacheService,
    private readonly siteRepository: SiteRepository,
  ) {}

  // Resolves a site's context (timezone, LE currency, legal entity) through the cache
  async resolve(siteId: string): Promise<SiteContext> {
    const cached = await this.cache.get(siteId);
    if (cached) return cached;

    const workspaceContext = await this.siteRepository.findWorkspaceContextById(siteId);
    if (!workspaceContext) {
      throw new NotFoundException('Site not found.');
    }

    const context: SiteContext = {
      siteTimezone: workspaceContext.timezone,
      siteCurrencyCode: workspaceContext.currencyCode,
      legalEntityId: workspaceContext.legalEntityId,
    };

    await this.cache.set(siteId, context);
    return context;
  }
}
