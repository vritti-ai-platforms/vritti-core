import type {
  ChannelItemDto,
  ChannelPriceDto,
  ResolvedChannelsDto,
} from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import type { ListingFilterDto } from '@domain/catalog-channels/dto/entity/listing-filter.dto';
import type {
  StorefrontListingDto,
  StorefrontListingsDto,
} from '@domain/catalog-channels/dto/entity/storefront-listing.dto';
import type { CatalogListingDetailDto } from '@domain/catalog-channels/dto/entity/variant-axis.dto';
import type {
  ListingFilterSelectionDto,
  ListingQueryDto,
} from '@domain/catalog-channels/dto/request/listing-query.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeCatalogChannelsController {
  private readonly logger = new Logger(LeCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'le.catalogChannels.list' })
  list(): Promise<ResolvedChannelsDto> {
    this.logger.log('catalogChannels.list');
    return this.service.list();
  }

  // One page of what a storefront makes available — the channel is resolved from the credential, not named by the
  // caller.
  @MessagePattern({ cmd: 'le.catalogChannels.app.currencies' })
  appCurrencies(@Payload() data: { appId: string }): Promise<string[]> {
    this.logger.log(`catalogChannels.app.currencies — appId: ${data.appId}`);
    return this.service.appCurrencies(data.appId);
  }

  @MessagePattern({ cmd: 'le.catalogChannels.app.listings' })
  appCatalogChannelListings(
    @Payload() data: { appId: string; currencyCode: string } & ListingQueryDto,
  ): Promise<StorefrontListingsDto> {
    const { appId, currencyCode, ...query } = data;
    this.logger.log(`catalogChannels.app.listings — appId: ${appId}, page: ${query.page ?? 1}`);
    return this.service.appCatalogChannelListings(appId, query, currencyCode);
  }

  // One listing by code, with the axes a product page switches flavour and size on
  @MessagePattern({ cmd: 'le.catalogChannels.app.listingByCode' })
  appListingByCode(
    @Payload() data: { appId: string; code: string; currencyCode: string },
  ): Promise<CatalogListingDetailDto | null> {
    this.logger.log(`catalogChannels.app.listingByCode — code: ${data.code}`);
    return this.service.appListingByCode(data.appId, data.code, data.currencyCode);
  }

  // The filter rail for the same resolved catalog, counted per the catalog's own filter mode
  @MessagePattern({ cmd: 'le.catalogChannels.app.listingFilters' })
  appListingFilters(
    @Payload() data: { appId: string; filters?: { code: string; values: string[] }[] },
  ): Promise<ListingFilterDto[]> {
    this.logger.log(`catalogChannels.app.listingFilters — appId: ${data.appId}`);
    return this.service.appListingFilters(data.appId, data.filters ?? []);
  }

  // The same range narrowed to variants the caller already holds — a wishlist or a basket
  @MessagePattern({ cmd: 'le.catalogChannels.app.listingsByCodes' })
  appListingsByCodes(
    @Payload() data: { appId: string; codes: string[]; currencyCode: string; filters?: ListingFilterSelectionDto[] },
  ): Promise<StorefrontListingDto[]> {
    this.logger.log(`catalogChannels.app.listingsByCodes — appId: ${data.appId}`);
    return this.service.appListingsByCodes(data.appId, data.codes, data.currencyCode, data.filters ?? []);
  }

  @MessagePattern({ cmd: 'le.catalogChannels.delete' })
  delete(@Payload() data: { channelId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.delete — channelId: ${data.channelId}`);
    return this.service.delete(data.channelId);
  }

  // One channel's items, each flagged with whether that channel makes it available
  @MessagePattern({ cmd: 'le.catalogChannels.items' })
  findItemsForTable(
    @Payload() data: { channelId: string; state: TableViewState },
  ): Promise<{ result: ChannelItemDto[]; count: number }> {
    this.logger.log(`catalogChannels.items — channelId: ${data.channelId}`);
    return this.service.findItemsForTable(data.channelId, data.state);
  }

  // One channel's prices in one currency, each flagged with whether it is available there
  @MessagePattern({ cmd: 'le.catalogChannels.prices' })
  findPricesForTable(
    @Payload() data: { channelId: string; currencyCode: string; state: TableViewState },
  ): Promise<{ result: ChannelPriceDto[]; count: number }> {
    this.logger.log(`catalogChannels.prices — channelId: ${data.channelId}, currency: ${data.currencyCode}`);
    return this.service.findPricesForTable(data.channelId, data.currencyCode, data.state);
  }

  // The currencies this channel's catalog is priced in
  @MessagePattern({ cmd: 'le.catalogChannels.currencies' })
  findCurrencies(@Payload() data: { channelId: string }): Promise<string[]> {
    this.logger.log(`catalogChannels.currencies — channelId: ${data.channelId}`);
    return this.service.findCurrencies(data.channelId);
  }

  // A null currency withdraws the item from the channel outright; a code withdraws it from that currency only, leaving
  // the others available
  @MessagePattern({ cmd: 'le.catalogChannels.setItemVisibility' })
  setItemVisibility(
    @Payload()
    data: { channelId: string; listingId: string; availableHere: boolean; currencyCode?: string | null },
  ): Promise<SuccessResponseDto> {
    this.logger.log(
      `catalogChannels.setItemVisibility — listingId: ${data.listingId}, currency: ${data.currencyCode ?? 'all'}`,
    );
    return this.service.setItemVisibility(data.channelId, data.listingId, data.availableHere, data.currencyCode);
  }
}
