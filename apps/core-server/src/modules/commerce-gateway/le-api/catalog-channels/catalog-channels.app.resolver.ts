import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
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
    return this.service.appCatalogChannelListings(appId, { filters, page, perPage, sort });
  }

  // One listing by SKU, with the axes a product page switches flavour and size on.
  //
  // By SKU because that is what a storefront puts in its address bar. Guarded by `app.listings`
  // rather than a permission of its own — the same catalogue read narrowed to one row, and an app
  // credential carries one composed permission set that a newly authored code does not reach.
  @Query(() => CatalogListingDetail, { name: 'leCatalogListingBySku', nullable: true })
  @RequirePermission(LE_CATALOG_CHANNELS.app.listings)
  leCatalogListingBySku(
    @AppId() appId: string,
    @Args({ name: 'sku', type: () => String }) sku: string,
  ): Promise<CatalogListingDetail | null> {
    this.logger.log(`QUERY leCatalogListingBySku — sku: ${sku}`);
    return this.service.appListingBySku(appId, sku);
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
