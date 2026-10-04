import type {
  ChannelItemDto,
  ChannelResolutionDto,
  ResolvedChannelsDto,
} from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import type { StorefrontListingDto } from '@domain/catalog-channels/dto/entity/storefront-listing.dto';
import { ResolveCatalogChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
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

  // What a storefront sells — the channel is resolved from the credential, not named by the caller
  @MessagePattern({ cmd: 'org.catalogChannels.app.listings' })
  appListings(@Payload() data: { appId: string }): Promise<StorefrontListingDto[]> {
    this.logger.log(`catalogChannels.app.listings — appId: ${data.appId}`);
    return this.service.appListings(data.appId);
  }

  // The same range narrowed to variants the caller already holds — a wishlist or a basket
  @MessagePattern({ cmd: 'org.catalogChannels.app.listingsFromVariants' })
  appListingsFromVariants(@Payload() data: { appId: string; variantIds: string[] }): Promise<StorefrontListingDto[]> {
    this.logger.log(`catalogChannels.app.listingsFromVariants — appId: ${data.appId}`);
    return this.service.appListings(data.appId, data.variantIds);
  }

  // Which catalog serves this channel — the caller's type comes from its API surface, not the payload
  @MessagePattern({ cmd: 'org.catalogChannels.resolve' })
  resolve(@Payload() dto: ResolveCatalogChannelDto): Promise<ChannelResolutionDto> {
    this.logger.log(`catalogChannels.resolve — type: ${dto.type}`);
    return this.service.tryResolve(dto);
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
