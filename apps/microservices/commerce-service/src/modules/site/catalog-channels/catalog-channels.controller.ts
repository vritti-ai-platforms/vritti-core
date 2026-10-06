import type { ChannelItemDto, ResolvedChannelsDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import type { StorefrontListingDto } from '@domain/catalog-channels/dto/entity/storefront-listing.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteCatalogChannelsController {
  private readonly logger = new Logger(SiteCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'site.catalogChannels.list' })
  list(): Promise<ResolvedChannelsDto> {
    this.logger.log('catalogChannels.list');
    return this.service.list();
  }

  // What a storefront sells — the channel is resolved from the credential, not named by the caller
  @MessagePattern({ cmd: 'site.catalogChannels.app.listings' })
  appListings(@Payload() data: { appId: string }): Promise<StorefrontListingDto[]> {
    this.logger.log(`catalogChannels.app.listings — appId: ${data.appId}`);
    return this.service.appListings(data.appId);
  }

  // The same range narrowed to variants the caller already holds — a wishlist or a basket
  @MessagePattern({ cmd: 'site.catalogChannels.app.listingsFromVariants' })
  appListingsFromVariants(@Payload() data: { appId: string; variantIds: string[] }): Promise<StorefrontListingDto[]> {
    this.logger.log(`catalogChannels.app.listingsFromVariants — appId: ${data.appId}`);
    return this.service.appListingsFromVariants(data.appId, data.variantIds);
  }

  @MessagePattern({ cmd: 'site.catalogChannels.delete' })
  delete(@Payload() data: { channelId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.delete — channelId: ${data.channelId}`);
    return this.service.delete(data.channelId);
  }

  // One channel's items, each flagged with whether that channel sells it
  @MessagePattern({ cmd: 'site.catalogChannels.items' })
  findItemsForTable(
    @Payload() data: { channelId: string; state: TableViewState },
  ): Promise<{ result: ChannelItemDto[]; count: number }> {
    this.logger.log(`catalogChannels.items — channelId: ${data.channelId}`);
    return this.service.findItemsForTable(data.channelId, data.state);
  }

  @MessagePattern({ cmd: 'site.catalogChannels.setItemVisibility' })
  setItemVisibility(
    @Payload() data: { channelId: string; listingId: string; sellsHere: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.setItemVisibility — listingId: ${data.listingId}`);
    return this.service.setItemVisibility(data.channelId, data.listingId, data.sellsHere);
  }
}
