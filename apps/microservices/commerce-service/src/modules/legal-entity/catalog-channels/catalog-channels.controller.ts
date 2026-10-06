import type { ChannelItemDto, ResolvedChannelsDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import type { ListingFilterDto } from '@domain/catalog-channels/dto/entity/listing-filter.dto';
import type {
  StorefrontListingDto,
  StorefrontListingsDto,
} from '@domain/catalog-channels/dto/entity/storefront-listing.dto';
import type { ListingQueryDto } from '@domain/catalog-channels/dto/request/listing-query.dto';
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

  // One page of what a storefront sells — the channel is resolved from the credential, not named by
  // the caller. Always paged: nothing reads the whole range any more.
  @MessagePattern({ cmd: 'le.catalogChannels.app.listings' })
  appListings(@Payload() data: { appId: string } & ListingQueryDto): Promise<StorefrontListingsDto> {
    const { appId, ...query } = data;
    this.logger.log(`catalogChannels.app.listings — appId: ${appId}, page: ${query.page ?? 1}`);
    return this.service.appListings(appId, query);
  }

  // One listing, by the variant a storefront stores against its own product row
  @MessagePattern({ cmd: 'le.catalogChannels.app.listing' })
  appListing(@Payload() data: { appId: string; variantId: string }): Promise<StorefrontListingDto | null> {
    this.logger.log(`catalogChannels.app.listing — variantId: ${data.variantId}`);
    return this.service.appListing(data.appId, data.variantId);
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
  @MessagePattern({ cmd: 'le.catalogChannels.app.listingsFromVariants' })
  appListingsFromVariants(@Payload() data: { appId: string; variantIds: string[] }): Promise<StorefrontListingDto[]> {
    this.logger.log(`catalogChannels.app.listingsFromVariants — appId: ${data.appId}`);
    return this.service.appListingsFromVariants(data.appId, data.variantIds);
  }

  @MessagePattern({ cmd: 'le.catalogChannels.delete' })
  delete(@Payload() data: { channelId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.delete — channelId: ${data.channelId}`);
    return this.service.delete(data.channelId);
  }

  // One channel's items, each flagged with whether that channel sells it
  @MessagePattern({ cmd: 'le.catalogChannels.items' })
  findItemsForTable(
    @Payload() data: { channelId: string; state: TableViewState },
  ): Promise<{ result: ChannelItemDto[]; count: number }> {
    this.logger.log(`catalogChannels.items — channelId: ${data.channelId}`);
    return this.service.findItemsForTable(data.channelId, data.state);
  }

  @MessagePattern({ cmd: 'le.catalogChannels.setItemVisibility' })
  setItemVisibility(
    @Payload() data: { channelId: string; listingId: string; sellsHere: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.setItemVisibility — listingId: ${data.listingId}`);
    return this.service.setItemVisibility(data.channelId, data.listingId, data.sellsHere);
  }
}
