import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { SiteType } from '@/db/schema';
import { APP_SITE_TYPES, type AppSite, AppSiteType } from '../graphql/app-site.type';

@Injectable()
export class SiteAppService {
  private readonly logger = new Logger(SiteAppService.name);

  constructor(private readonly siteRepository: SiteDomainRepository) {}

  /**
   * The stores an organization may sell from, each carrying its legal entity's currency.
   *
   * One repository call doing all the narrowing — both `is_active` flags, the type filter and the
   * currency join are the database's work. `types` comes from the caller, so a storefront asks for
   * OUTLET and gets outlets: the judgement stays with whoever is rendering, and the rows that judgement
   * excludes never leave Postgres.
   *
   * Nothing is filtered here. Anything this method dropped would be a row core had already paid to
   * read, serialise and (for a storefront) cache under a key that did not mention the exclusion.
   */
  async listForApp(orgId: string, types?: AppSiteType[]): Promise<AppSite[]> {
    const rows = await this.siteRepository.findForAppByOrg(orgId, types as SiteType[] | undefined);

    const offered = rows.map((row) => ({
      ...row,
      // Unmapped is not possible today — the record covers the enum — but falling back to OUTLET
      // would silently offer a warehouse to shoppers, so the fallback is the narrower answer.
      type: APP_SITE_TYPES[row.type] ?? AppSiteType.OUTLET,
    }));

    this.logger.log(`Sites for org ${orgId}${types?.length ? ` (${types.join(', ')})` : ''}: ${offered.length}`);
    return offered;
  }
}
