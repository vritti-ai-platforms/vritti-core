import { Logger } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
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

  // What this storefront may price in. A switcher reads this to know which currencies exist before
  // offering one — the session then carries the choice, and every priced read is made in it.
  @Query(() => [String], { name: 'siteCatalogCurrencies' })
  @RequirePermission(SITE_CATALOG_CHANNELS.listings)
  siteCatalogCurrencies(@AppId() appId: string): Promise<string[]> {
    this.logger.log('QUERY siteCatalogCurrencies');
    return this.service.appCurrencies(appId);
  }

  // One page of what this credential's channel offers, at this workspace's price, with delisted rows
  // and channel exclusions already dropped. Always paged — nothing reads the whole range.
  @Query(() => CatalogListings, { name: 'siteCatalogListings' })
  @RequirePermission(SITE_CATALOG_CHANNELS.listings)
  siteCatalogListings(
    @AppId() appId: string,
    @Args({ name: 'currencyCode', type: () => String }) currencyCode: string,
    @Args({ name: 'filters', type: () => [FilterInput], nullable: true }) filters?: FilterInput[],
    @Args({ name: 'page', type: () => Int, nullable: true }) page?: number,
    @Args({ name: 'perPage', type: () => Int, nullable: true }) perPage?: number,
    @Args({ name: 'sort', type: () => ListingSort, nullable: true }) sort?: ListingSort,
  ): Promise<CatalogListings> {
    this.logger.log(`QUERY siteCatalogListings — page: ${page ?? 1}, filters: ${filters?.length ?? 0}`);
    return this.service.appCatalogChannelListings(appId, { filters, page, perPage, sort }, currencyCode);
  }

  // One listing by code, with the axes a product page switches flavour and size on.
  @Query(() => CatalogListingDetail, { name: 'siteCatalogListingByCode', nullable: true })
  @RequirePermission(SITE_CATALOG_CHANNELS.listings)
  siteCatalogListingByCode(
    @AppId() appId: string,
    @Args({ name: 'code', type: () => String }) code: string,
    @Args({ name: 'currencyCode', type: () => String }) currencyCode: string,
  ): Promise<CatalogListingDetail | null> {
    this.logger.log(`QUERY siteCatalogListingByCode — code: ${code}`);
    return this.service.appListingByCode(appId, code, currencyCode);
  }

  // The same range narrowed to variants the caller already holds — reconciling a wishlist or a basket
  @Query(() => [CatalogListing], { name: 'siteCatalogListingsByCodes' })
  @RequirePermission(SITE_CATALOG_CHANNELS.listings)
  siteCatalogListingsByCodes(
    @AppId() appId: string,
    @Args({ name: 'codes', type: () => [String] }) codes: string[],
    @Args({ name: 'currencyCode', type: () => String }) currencyCode: string,
  ): Promise<CatalogListing[]> {
    this.logger.log(`QUERY siteCatalogListingsByCodes — ${codes.length} codes`);
    return this.service.appListingsByCodes(appId, codes, currencyCode);
  }
}
