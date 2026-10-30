import { Logger } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
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

  // What this storefront may price in.
  @Query(() => [String], { name: 'leCatalogCurrencies' })
  @RequirePermission(LE_CATALOG_CHANNELS.listings)
  leCatalogCurrencies(@AppId() appId: string): Promise<string[]> {
    this.logger.log('QUERY leCatalogCurrencies');
    return this.service.appCurrencies(appId);
  }

  // One page of what this credential's channel offers, at this workspace's price, with delisted rows and channel
  // exclusions already dropped.
  @Query(() => CatalogListings, { name: 'leCatalogListings' })
  @RequirePermission(LE_CATALOG_CHANNELS.listings)
  leCatalogListings(
    @AppId() appId: string,
    @Args({ name: 'currencyCode', type: () => String }) currencyCode: string,
    @Args({ name: 'filters', type: () => [FilterInput], nullable: true }) filters?: FilterInput[],
    @Args({ name: 'page', type: () => Int, nullable: true }) page?: number,
    @Args({ name: 'perPage', type: () => Int, nullable: true }) perPage?: number,
    @Args({ name: 'sort', type: () => ListingSort, nullable: true }) sort?: ListingSort,
  ): Promise<CatalogListings> {
    this.logger.log(`QUERY leCatalogListings — page: ${page ?? 1}, filters: ${filters?.length ?? 0}`);
    return this.service.appCatalogChannelListings(appId, { filters, page, perPage, sort }, currencyCode);
  }

  // One listing by code, with the axes a product page switches flavour and size on.
  @Query(() => CatalogListingDetail, { name: 'leCatalogListingByCode', nullable: true })
  @RequirePermission(LE_CATALOG_CHANNELS.listings)
  leCatalogListingByCode(
    @AppId() appId: string,
    @Args({ name: 'code', type: () => String }) code: string,
    @Args({ name: 'currencyCode', type: () => String }) currencyCode: string,
  ): Promise<CatalogListingDetail | null> {
    this.logger.log(`QUERY leCatalogListingByCode — code: ${code}`);
    return this.service.appListingByCode(appId, code, currencyCode);
  }

  // The same range narrowed to variants the caller already holds — reconciling a wishlist or a cart
  @Query(() => [CatalogListing], { name: 'leCatalogListingsByCodes' })
  @RequirePermission(LE_CATALOG_CHANNELS.listings)
  leCatalogListingsByCodes(
    @AppId() appId: string,
    @Args({ name: 'codes', type: () => [String] }) codes: string[],
    @Args({ name: 'currencyCode', type: () => String }) currencyCode: string,
    @Args({ name: 'filters', type: () => [FilterInput], nullable: true }) filters?: FilterInput[],
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY leCatalogListingsByCodes — ${codes.length} codes`);
    return this.service.appListingsByCodes(appId, codes, currencyCode, filters ?? []);
  }
}
