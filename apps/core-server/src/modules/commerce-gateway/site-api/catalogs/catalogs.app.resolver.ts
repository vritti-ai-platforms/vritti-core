import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, SiteId } from '@/security/decorators';
import { CatalogListing } from '../../org-api/catalogs/graphql/catalog-listing.type';
import { SiteCatalogsGatewayService } from './services/catalogs-gateway.service';

/**
 * The range an outlet's own customer website sells.
 *
 * The request carries `x-site-id`, so it is checked in SITE scope, the site's APP channel is preferred
 * over its LE's and the org's, and the site's own price wins over the organization-wide row.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_CATALOGS.featureCode)
export class SiteCatalogsAppResolver {
  private readonly logger = new Logger(SiteCatalogsAppResolver.name);

  constructor(private readonly service: SiteCatalogsGatewayService) {}

  /** Everything this outlet sells, delisted rows and channel exclusions already dropped. */
  @Query(() => [CatalogListing], { name: 'siteCatalogListings' })
  @RequirePermission(SITE_CATALOGS.listings.view)
  siteCatalogListings(@AppId() appId: string, @SiteId() siteId: string): Promise<CatalogListing[]> {
    this.logger.log(`QUERY siteCatalogListings — site: ${siteId}`);
    return this.service.findStorefrontListings(appId, siteId);
  }
}
