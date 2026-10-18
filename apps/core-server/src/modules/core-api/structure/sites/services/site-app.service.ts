import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { SiteType } from '@/db/schema';
import { APP_SITE_TYPES, type AppSite, AppSiteType } from '../graphql/app-site.type';

@Injectable()
export class SiteAppService {
  private readonly logger = new Logger(SiteAppService.name);

  constructor(private readonly siteRepository: SiteDomainRepository) {}

  // The stores an organization may sell from, each carrying its legal entity's currency.
  async listForApp(orgId: string, types?: AppSiteType[]): Promise<AppSite[]> {
    const rows = await this.siteRepository.findForAppByOrg(orgId, types as SiteType[] | undefined);

    const offered = rows.map((row) => ({
      ...row,
      type: APP_SITE_TYPES[row.type] ?? AppSiteType.OUTLET,
    }));

    this.logger.log(`Sites for org ${orgId}${types?.length ? ` (${types.join(', ')})` : ''}: ${offered.length}`);
    return offered;
  }
}
