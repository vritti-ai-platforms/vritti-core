import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from './graphql/catalog-listing.type';
import { CatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

/**
 * The range a storefront sells, read through its own APP channel.
 *
 * Lives with channels rather than catalogs because the channel is what answers: a credential names
 * no catalogue, and core resolves one from the APP channel in whichever workspace the request
 * carries. The type is fixed to APP by the server — a caller cannot ask as a till or a wholesale
 * buyer — and the workspace comes from `x-le-id` / `x-site-id`, so one query serves every scope and
 * RLS decides what it may see.
 *
 * Read only. A storefront lists what staff put in front of it; pricing and listing are staff work on
 * the session-authenticated surface.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
export class CatalogChannelsAppResolver {
  private readonly logger = new Logger(CatalogChannelsAppResolver.name);

  constructor(private readonly service: CatalogChannelsGatewayService) {}

  /** Everything sellable, delisted rows and channel exclusions already dropped, at this workspace's price. */
  @Query(() => [CatalogListing], { name: 'catalogListings' })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.listings)
  catalogListings(@AppId() appId: string): Promise<CatalogListing[]> {
    this.logger.log('QUERY catalogListings');
    return this.service.appListings(appId);
  }

  /** The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket. */
  @Query(() => [CatalogListing], { name: 'catalogListingsFromVariants' })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.listingsFromVariants)
  catalogListingsFromVariants(
    @AppId() appId: string,
    @Args({ name: 'variantIds', type: () => [ID] }) variantIds: string[],
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY catalogListingsFromVariants — ${variantIds.length} variants`);
    return this.service.appListings(appId, variantIds);
  }
}
