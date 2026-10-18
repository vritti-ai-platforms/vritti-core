import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { AppTypeValues } from '@/db/schema';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { AppSite, AppSiteType } from './graphql/app-site.type';
import { SiteAppService } from './services/site-app.service';

// Where a storefront may sell from, for an app credential.
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
export class SiteAppResolver {
  private readonly logger = new Logger(SiteAppResolver.name);

  constructor(private readonly siteAppService: SiteAppService) {}

  // The stores this credential's organization sells from — the options behind a store switcher.
  @Query(() => [AppSite], { name: 'appSites' })
  appSites(
    @OrgId() orgId: string,
    @Args({ name: 'types', type: () => [AppSiteType], nullable: true }) types?: AppSiteType[],
  ): Promise<AppSite[]> {
    this.logger.log(`QUERY appSites — types: ${types?.join(', ') ?? 'all'}`);
    return this.siteAppService.listForApp(orgId, types);
  }
}
