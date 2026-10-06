import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from './graphql/catalog-listing.type';
import { CatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
export class CatalogChannelsAppResolver {
  private readonly logger = new Logger(CatalogChannelsAppResolver.name);

  constructor(private readonly service: CatalogChannelsGatewayService) {}

  // Everything sellable, delisted rows and channel exclusions already dropped, at this workspace's price
  @Query(() => [CatalogListing], { name: 'catalogListings' })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.listings)
  catalogListings(@AppId() appId: string): Promise<CatalogListing[]> {
    this.logger.log('QUERY catalogListings');
    return this.service.appListings(appId);
  }

  // The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket
  @Query(() => [CatalogListing], { name: 'catalogListingsFromVariants' })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.listingsFromVariants)
  catalogListingsFromVariants(
    @AppId() appId: string,
    @Args({ name: 'variantIds', type: () => [ID] }) variantIds: string[],
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY catalogListingsFromVariants — ${variantIds.length} variants`);
    return this.service.appListingsFromVariants(appId, variantIds);
  }
}
