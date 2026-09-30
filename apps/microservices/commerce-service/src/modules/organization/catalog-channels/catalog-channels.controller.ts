import type {
  CatalogChannelDto,
  ChannelItemDto,
  ChannelResolutionDto,
  ChannelScreenEntryDto,
} from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import {
  ResolveCatalogChannelDto,
  UpdateCatalogChannelDto,
} from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableViewState } from '@vritti/api-sdk/data-table';
import type { SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class OrgCatalogChannelsController {
  private readonly logger = new Logger(OrgCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // Everything the channels screen needs: each type's default plus every app / terminal under it
  @MessagePattern({ cmd: 'org.catalogChannels.screen' })
  screen(): Promise<ChannelScreenEntryDto[]> {
    this.logger.log('catalogChannels.screen');
    return this.service.screen();
  }

  // Every channel selling one catalog — the read-only tab on the catalog detail
  @MessagePattern({ cmd: 'org.catalogChannels.byCatalog' })
  findByCatalog(@Payload() data: { catalogId: string }): Promise<CatalogChannelDto[]> {
    this.logger.log(`catalogChannels.byCatalog — catalogId: ${data.catalogId}`);
    return this.service.findByCatalog(data.catalogId);
  }

  // Which catalog serves this channel — the caller's type comes from its API surface, not the payload
  @MessagePattern({ cmd: 'org.catalogChannels.resolve' })
  resolve(@Payload() dto: ResolveCatalogChannelDto): Promise<ChannelResolutionDto> {
    this.logger.log(`catalogChannels.resolve — type: ${dto.type}`);
    return this.service.tryResolve(dto);
  }

  // Everything below keys on channelId and is type-neutral — only creation differs per type
  @MessagePattern({ cmd: 'org.catalogChannels.update' })
  update(@Payload() dto: UpdateCatalogChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`catalogChannels.update — channelId: ${dto.channelId}`);
    return this.service.update(dto.channelId, dto.catalogId);
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
