import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from '../../org-api/catalog-channels/graphql/catalog-listing.type';
import { SiteCatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

/**
 * The range a outlet's website sells, read through its own APP channel.
 *
 * Its own query and its own permission rather than the organization's: the workspace this acts in is
 * what decides which APP channel answers and which price row applies, so the code checked and the
 * header sent always name the same level.
 *
 * Read only. A storefront lists what staff put in front of it.
 */
@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_CATALOG_CHANNELS.featureCode)
export class SiteCatalogChannelsAppResolver {
  private readonly logger = new Logger(SiteCatalogChannelsAppResolver.name);

  constructor(private readonly service: SiteCatalogChannelsGatewayService) {}

  /** Everything sellable here, delisted rows and channel exclusions already dropped. */
  @Query(() => [CatalogListing], { name: 'siteCatalogListings' })
  @RequirePermission(SITE_CATALOG_CHANNELS.app.listings)
  siteCatalogListings(@AppId() appId: string): Promise<CatalogListing[]> {
    this.logger.log('QUERY siteCatalogListings');
    return this.service.appListings(appId);
  }

  /** The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket. */
  @Query(() => [CatalogListing], { name: 'siteCatalogListingsFromVariants' })
  @RequirePermission(SITE_CATALOG_CHANNELS.app.listingsFromVariants)
  siteCatalogListingsFromVariants(
    @AppId() appId: string,
    @Args({ name: 'variantIds', type: () => [ID] }) variantIds: string[],
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY siteCatalogListingsFromVariants — ${variantIds.length} variants`);
    return this.service.appListings(appId, variantIds);
  }
}
