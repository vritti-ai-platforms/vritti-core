import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { AppSite, AppSiteType } from './graphql/app-site.type';
import { SiteAppService } from './services/site-app.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
export class SiteAppResolver {
  private readonly logger = new Logger(SiteAppResolver.name);

  constructor(private readonly siteAppService: SiteAppService) {}

  /**
   * The stores this credential's organization sells from — the options behind a store switcher.
   *
   * Org-scoped, so it carries no workspace header: a caller asking which stores exist has not chosen
   * one yet, and a site header would narrow the very question being asked.
   *
   * Its own query and its own permission rather than half of a combined one, so a shop with a store
   * switcher and no interest in legal entities pays for one read and is granted one code.
   *
   * `types` narrows in the database. A storefront passes `[OUTLET]` because a warehouse is not
   * somewhere a person shops — but it says so here rather than discarding rows it has already been
   * sent, which would make the payload and the cache entry describe a question nobody asked.
   */
  @Query(() => [AppSite], { name: 'appSites' })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.sites)
  appSites(
    @OrgId() orgId: string,
    @Args({ name: 'types', type: () => [AppSiteType], nullable: true }) types?: AppSiteType[],
  ): Promise<AppSite[]> {
    this.logger.log(`QUERY appSites — types: ${types?.join(', ') ?? 'all'}`);
    return this.siteAppService.listForApp(orgId, types);
  }
}
