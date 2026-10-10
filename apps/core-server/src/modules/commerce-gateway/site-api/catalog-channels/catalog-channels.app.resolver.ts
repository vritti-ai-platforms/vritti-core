import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SITE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from '../../org-api/catalog-channels/graphql/catalog-listing.type';
import {
  CatalogListingDetail,
  CatalogListings,
  FilterInput,
  ListingSort,
} from '../../org-api/catalog-channels/graphql/catalog-listings.type';
import { SiteCatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(SITE_CATALOG_CHANNELS.featureCode)
export class SiteCatalogChannelsAppResolver {
  private readonly logger = new Logger(SiteCatalogChannelsAppResolver.name);

  constructor(private readonly service: SiteCatalogChannelsGatewayService) {}

  // One page of what this credential's channel sells, at this workspace's price, with delisted rows
  // and channel exclusions already dropped. Always paged — nothing reads the whole range.
  @Query(() => CatalogListings, { name: 'siteCatalogListings' })
  @RequirePermission(SITE_CATALOG_CHANNELS.app.listings)
  siteCatalogListings(
    @AppId() appId: string,
    @Args({ name: 'filters', type: () => [FilterInput], nullable: true }) filters?: FilterInput[],
    @Args({ name: 'page', type: () => Int, nullable: true }) page?: number,
    @Args({ name: 'perPage', type: () => Int, nullable: true }) perPage?: number,
    @Args({ name: 'sort', type: () => ListingSort, nullable: true }) sort?: ListingSort,
  ): Promise<CatalogListings> {
    this.logger.log(`QUERY siteCatalogListings — page: ${page ?? 1}, filters: ${filters?.length ?? 0}`);
    return this.service.appCatalogChannelListings(appId, { filters, page, perPage, sort });
  }

  // One listing by SKU, with the axes a product page switches flavour and size on.
  @Query(() => CatalogListingDetail, { name: 'siteCatalogListingBySku', nullable: true })
  @RequirePermission(SITE_CATALOG_CHANNELS.app.listings)
  siteCatalogListingBySku(
    @AppId() appId: string,
    @Args({ name: 'sku', type: () => String }) sku: string,
  ): Promise<CatalogListingDetail | null> {
    this.logger.log(`QUERY siteCatalogListingBySku — sku: ${sku}`);
    return this.service.appListingBySku(appId, sku);
  }

  // The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket
  @Query(() => [CatalogListing], { name: 'siteCatalogListingsFromVariants' })
  @RequirePermission(SITE_CATALOG_CHANNELS.app.listingsFromVariants)
  siteCatalogListingsFromVariants(
    @AppId() appId: string,
    @Args({ name: 'variantIds', type: () => [ID] }) variantIds: string[],
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY siteCatalogListingsFromVariants — ${variantIds.length} variants`);
    return this.service.appListingsFromVariants(appId, variantIds);
  }
}
