import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from '../../org-api/catalog-channels/graphql/catalog-listing.type';
import {
  CatalogListings,
  FilterInput,
  ListingSort,
} from '../../org-api/catalog-channels/graphql/catalog-listings.type';
import { LeCatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(LE_CATALOG_CHANNELS.featureCode)
export class LeCatalogChannelsAppResolver {
  private readonly logger = new Logger(LeCatalogChannelsAppResolver.name);

  constructor(private readonly service: LeCatalogChannelsGatewayService) {}

  // One page of what this credential's channel sells, at this workspace's price, with delisted rows
  // and channel exclusions already dropped. Always paged — nothing reads the whole range.
  @Query(() => CatalogListings, { name: 'leCatalogListings' })
  @RequirePermission(LE_CATALOG_CHANNELS.app.listings)
  leCatalogListings(
    @AppId() appId: string,
    @Args({ name: 'filters', type: () => [FilterInput], nullable: true }) filters?: FilterInput[],
    @Args({ name: 'page', type: () => Int, nullable: true }) page?: number,
    @Args({ name: 'perPage', type: () => Int, nullable: true }) perPage?: number,
    @Args({ name: 'sort', type: () => ListingSort, nullable: true }) sort?: ListingSort,
  ): Promise<CatalogListings> {
    this.logger.log(`QUERY leCatalogListings — page: ${page ?? 1}, filters: ${filters?.length ?? 0}`);
    return this.service.appListings(appId, { filters, page, perPage, sort });
  }

  // One listing, by the variant a storefront stores against its own product row
  @Query(() => CatalogListing, { name: 'leCatalogListing', nullable: true })
  @RequirePermission(LE_CATALOG_CHANNELS.app.listing)
  leCatalogListing(
    @AppId() appId: string,
    @Args({ name: 'variantId', type: () => ID }) variantId: string,
  ): Promise<CatalogListing | null> {
    this.logger.log(`QUERY leCatalogListing — variantId: ${variantId}`);
    return this.service.appListing(appId, variantId);
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
