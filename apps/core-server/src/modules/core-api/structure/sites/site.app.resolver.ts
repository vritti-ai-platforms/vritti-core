import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { AppTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { AppSite, AppSiteType } from './graphql/app-site.type';
import { SiteAppService } from './services/site-app.service';

/**
 * Where a storefront may sell from, for an app credential.
 *
 * **No feature or permission code, deliberately.** Those belong to the modules that front a
 * microservice — the commerce and payments gateways, whose features are authored in the cloud catalog.
 * This is core's own structure, and a core-api module carries no RBAC codes: the gate is the
 * credential. The guard verifies an Ed25519 signature, `AppRequestResolver` takes the organization
 * from the credential rather than from the caller, and RLS confines every read to it — so an app can
 * enumerate its own organization's structure and nothing else.
 *
 * An earlier revision borrowed `catalog-channels` for this, which made a core module depend on the
 * commerce permission lib for a feature it has no part in.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
export class SiteAppResolver {
  private readonly logger = new Logger(SiteAppResolver.name);

  constructor(private readonly siteAppService: SiteAppService) {}

  /**
   * The stores this credential's organization sells from — the options behind a store switcher.
   *
   * Org-scoped, so it carries no workspace header: a caller asking which stores exist has not chosen
   * one yet, and a site header would narrow the very question being asked.
   *
   * Its own query rather than half of a combined one, so a shop with a store switcher and no interest
   * in legal entities pays for one read.
   *
   * `types` narrows in the database. A storefront passes `[OUTLET]` because a warehouse is not
   * somewhere a person shops — but it says so here rather than discarding rows it has already been
   * sent, which would make the payload and the cache entry describe a question nobody asked.
   */
  @Query(() => [AppSite], { name: 'appSites' })
  appSites(
    @OrgId() orgId: string,
    @Args({ name: 'types', type: () => [AppSiteType], nullable: true }) types?: AppSiteType[],
  ): Promise<AppSite[]> {
    this.logger.log(`QUERY appSites — types: ${types?.join(', ') ?? 'all'}`);
    return this.siteAppService.listForApp(orgId, types);
  }
}
