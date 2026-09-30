import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from './graphql/catalog-listing.type';
import { CatalogsGatewayService } from './services/catalogs-gateway.service';

/**
 * The range an organization-wide website sells.
 *
 * Unlike the basket and the wishlist, this needs no party — it is the shop's own catalogue,
 * not one person's rows. What it does need is the credential, because the catalogue is resolved
 * from the APP channel: a website can read the range it was given and no other.
 *
 * Read only. A storefront lists what staff put in front of it; pricing and listing are staff work
 * on the session-authenticated surface. An LE's B2B website and an outlet's own website have their
 * own queries in `le-api/catalogs` and `site-api/catalogs`, each checked in its own scope.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_CATALOGS.featureCode)
export class CatalogsAppResolver {
  private readonly logger = new Logger(CatalogsAppResolver.name);

  constructor(private readonly service: CatalogsGatewayService) {}

  /** Everything sellable, delisted rows and channel exclusions already dropped, at the org-wide price. */
  @Query(() => [CatalogListing], { name: 'catalogListings' })
  @RequirePermission(ORG_CATALOGS.listings.view)
  catalogListings(@AppId() appId: string): Promise<CatalogListing[]> {
    this.logger.log('QUERY catalogListings');
    return this.service.findStorefrontListings(appId);
  }
}
