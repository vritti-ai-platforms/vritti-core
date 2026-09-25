import { SiteGroupDomainRepository } from '@domain/site-group/repositories/site-group.repository';
import { Injectable } from '@nestjs/common';
import { SiteGroupContextCacheService } from './site-group-context-cache.service';

@Injectable()
export class SiteGroupContextResolverService {
  constructor(
    private readonly cache: SiteGroupContextCacheService,
    private readonly siteGroupRepository: SiteGroupDomainRepository,
  ) {}

  // Resolves a group's member site ids (including descendant groups) through the cache
  async resolveSiteIds(groupId: string): Promise<string[]> {
    const cached = await this.cache.get(groupId);
    if (cached) return cached;

    const siteIds = await this.siteGroupRepository.findMemberSiteIds(groupId);
    await this.cache.set(groupId, siteIds);
    return siteIds;
  }
}
