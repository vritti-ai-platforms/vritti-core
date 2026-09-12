import type { CatalogChannelDto, ChannelItemDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import {
  CreateCatalogChannelDto,
  UpdateCatalogChannelDto,
} from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { CatalogChannelTypeValues } from '@/db/schema';

@Controller()
export class OrgAppCatalogChannelController {
  private readonly logger = new Logger(OrgAppCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // Returns paginated App channels for the data table
  @MessagePattern({ cmd: 'org.appCatalogChannels.table' })
  findForTable(@Payload() state: TableViewState): Promise<{ result: CatalogChannelDto[]; count: number }> {
    this.logger.log('appCatalogChannels.table');
    return this.service.findForTable(CatalogChannelTypeValues.APP, state);
  }

  @MessagePattern({ cmd: 'org.appCatalogChannels.create' })
  create(@Payload() dto: CreateCatalogChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`appCatalogChannels.create — catalogId: ${dto.catalogId}, appId: ${dto.appId ?? 'any'}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.appCatalogChannels.update' })
  update(@Payload() dto: UpdateCatalogChannelDto): Promise<SuccessResponseDto> {
    this.logger.log(`appCatalogChannels.update — channelId: ${dto.channelId}`);
    return this.service.update(dto.channelId, dto.catalogId);
  }

  @MessagePattern({ cmd: 'org.appCatalogChannels.delete' })
  delete(@Payload() data: { channelId: string }): Promise<SuccessResponseDto> {
    this.logger.log(`appCatalogChannels.delete — channelId: ${data.channelId}`);
    return this.service.delete(data.channelId);
  }

  // Returns paginated items of one channel for the data table
  @MessagePattern({ cmd: 'org.appCatalogChannels.items' })
  findItemsForTable(
    @Payload() data: { channelId: string; state: TableViewState },
  ): Promise<{ result: ChannelItemDto[]; count: number }> {
    this.logger.log(`appCatalogChannels.items — channelId: ${data.channelId}`);
    return this.service.findItemsForTable(data.channelId, data.state);
  }

  @MessagePattern({ cmd: 'org.appCatalogChannels.setItemVisibility' })
  setItemVisibility(
    @Payload() data: { channelId: string; listingId: string; sellsHere: boolean },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`appCatalogChannels.setItemVisibility — listingId: ${data.listingId}`);
    return this.service.setItemVisibility(data.channelId, data.listingId, data.sellsHere);
  }
}
