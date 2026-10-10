import type { ChannelItemDto, ResolvedChannelsDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import type { ListingFilterDto } from '@domain/catalog-channels/dto/entity/listing-filter.dto';
import type {
  StorefrontListingDto,
  StorefrontListingsDto,
} from '@domain/catalog-channels/dto/entity/storefront-listing.dto';
import type { CatalogListingDetailDto } from '@domain/catalog-channels/dto/entity/variant-axis.dto';
import type { ListingQueryDto } from '@domain/catalog-channels/dto/request/listing-query.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class OrgCatalogChannelsController {
  private readonly logger = new Logger(OrgCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // Everything the channels list needs: each type's default plus every app / terminal under it
  @MessagePattern({ cmd: 'org.catalogChannels.list' })
  list(): Promise<ResolvedChannelsDto> {
    this.logger.log('catalogChannels.list');
    return this.service.list();
  }

  // One page of what a storefront sells — the channel is resolved from the credential, not named by
  // the caller. Always paged: nothing reads the whole range any more.
  @MessagePattern({ cmd: 'org.catalogChannels.app.listings' })
  appCatalogChannelListings(@Payload() data: { appId: string } & ListingQueryDto): Promise<StorefrontListingsDto> {
    const { appId, ...query } = data;
    this.logger.log(`catalogChannels.app.listings — appId: ${appId}, page: ${query.page ?? 1}`);
    return this.service.appCatalogChannelListings(appId, query);
  }

  // One listing by SKU, with the axes a product page switches flavour and size on
  @MessagePattern({ cmd: 'org.catalogChannels.app.listingBySku' })
  appListingBySku(@Payload() data: { appId: string; sku: string }): Promise<CatalogListingDetailDto | null> {
    this.logger.log(`catalogChannels.app.listingBySku — sku: ${data.sku}`);
    return this.service.appListingBySku(data.appId, data.sku);
  }

  // The filter rail for the same resolved catalog, counted per the catalog's own filter mode
  @MessagePattern({ cmd: 'org.catalogChannels.app.listingFilters' })
  appListingFilters(
    @Payload() data: { appId: string; filters?: { code: string; values: string[] }[] },
  ): Promise<ListingFilterDto[]> {
    this.logger.log(`catalogChannels.app.listingFilters — appId: ${data.appId}`);
    return this.service.appListingFilters(data.appId, data.filters ?? []);
  }

  // The same range narrowed to variants the caller already holds — a wishlist or a basket
  @MessagePattern({ cmd: 'org.catalogChannels.app.listingsFromVariants' })
  appListingsFromVariants(@Payload() data: { appId: string; variantIds: string[] }): Promise<StorefrontListingDto[]> {
    this.logger.log(`catalogChannels.app.listingsFromVariants — appId: ${data.appId}`);
    return this.service.appListingsFromVariants(data.appId, data.variantIds);
  }

  @MessagePattern({ cmd: 'org.catalogChannels.delete' })
  delete(@Payload() data: { channelId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.delete — channelId: ${data.channelId}`);
    return this.service.delete(data.channelId);
  }

  // One channel's items, each flagged with whether that channel sells it
  @MessagePattern({ cmd: 'org.catalogChannels.items' })
  findItemsForTable(
    @Payload() data: { channelId: string; state: TableViewState },
  ): Promise<{ result: ChannelItemDto[]; count: number }> {
    this.logger.log(`catalogChannels.items — channelId: ${data.channelId}`);
    return this.service.findItemsForTable(data.channelId, data.state);
  }

  @MessagePattern({ cmd: 'org.catalogChannels.setItemVisibility' })
  setItemVisibility(
    @Payload() data: { channelId: string; listingId: string; sellsHere: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.setItemVisibility — listingId: ${data.listingId}`);
    return this.service.setItemVisibility(data.channelId, data.listingId, data.sellsHere);
  }
}
