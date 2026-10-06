import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from '../../org-api/catalog-channels/graphql/catalog-listing.type';
import { LeCatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(LE_CATALOG_CHANNELS.featureCode)
export class LeCatalogChannelsAppResolver {
  private readonly logger = new Logger(LeCatalogChannelsAppResolver.name);

  constructor(private readonly service: LeCatalogChannelsGatewayService) {}

  // Everything sellable here, delisted rows and channel exclusions already dropped
  @Query(() => [CatalogListing], { name: 'leCatalogListings' })
  @RequirePermission(LE_CATALOG_CHANNELS.app.listings)
  leCatalogListings(@AppId() appId: string): Promise<CatalogListing[]> {
    this.logger.log('QUERY leCatalogListings');
    return this.service.appListings(appId);
  }

  // The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket
  @Query(() => [CatalogListing], { name: 'leCatalogListingsFromVariants' })
  @RequirePermission(LE_CATALOG_CHANNELS.app.listingsFromVariants)
  leCatalogListingsFromVariants(
    @AppId() appId: string,
    @Args({ name: 'variantIds', type: () => [ID] }) variantIds: string[],
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY leCatalogListingsFromVariants — ${variantIds.length} variants`);
    return this.service.appListingsFromVariants(appId, variantIds);
  }
}
