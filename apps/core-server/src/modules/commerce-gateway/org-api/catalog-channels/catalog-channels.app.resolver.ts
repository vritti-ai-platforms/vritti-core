import { Logger } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId } from '@/security/decorators';
import { CatalogListing } from './graphql/catalog-listing.type';
import { CatalogListingDetail, CatalogListings, FilterInput, ListingSort } from './graphql/catalog-listings.type';
import { CatalogChannelsGatewayService } from './services/catalog-channels-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_CATALOG_CHANNELS.featureCode)
export class CatalogChannelsAppResolver {
  private readonly logger = new Logger(CatalogChannelsAppResolver.name);

  constructor(private readonly service: CatalogChannelsGatewayService) {}

  // One page of what this credential's channel sells, at this workspace's price, with delisted rows
  // and channel exclusions already dropped. Always paged — nothing reads the whole range.
  @Query(() => CatalogListings, { name: 'catalogListings' })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.listings)
  catalogListings(
    @AppId() appId: string,
    @Args({ name: 'filters', type: () => [FilterInput], nullable: true }) filters?: FilterInput[],
    @Args({ name: 'page', type: () => Int, nullable: true }) page?: number,
    @Args({ name: 'perPage', type: () => Int, nullable: true }) perPage?: number,
    @Args({ name: 'sort', type: () => ListingSort, nullable: true }) sort?: ListingSort,
  ): Promise<CatalogListings> {
    this.logger.log(`QUERY catalogListings — page: ${page ?? 1}, filters: ${filters?.length ?? 0}`);
    return this.service.appCatalogChannelListings(appId, { filters, page, perPage, sort });
  }

  // One listing by SKU, with the axes a product page switches flavour and size on.
  //
  // By SKU because that is what the storefront puts in its address bar: it already names the
  // offering and one value per dimension, so the URL says what the page is. Guarded by
  // `app.listings` rather than a permission of its own — it is the same catalogue read narrowed to
  // one row, and an app credential carries one composed permission set that a newly authored code
  // does not reach.
  @Query(() => CatalogListingDetail, { name: 'catalogListingBySku', nullable: true })
  @RequirePermission(ORG_CATALOG_CHANNELS.app.listings)
  catalogListingBySku(
    @AppId() appId: string,
    @Args({ name: 'sku', type: () => String }) sku: string,
  ): Promise<CatalogListingDetail | null> {
    this.logger.log(`QUERY catalogListingBySku — sku: ${sku}`);
    return this.service.appListingBySku(appId, sku);
  }

  // The same range narrowed to variants the caller already holds — a wishlist or a basket
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
