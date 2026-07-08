import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { CatalogChannelsService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class CatalogChannelsController {
  private readonly logger = new Logger(CatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsService) {}

  // Lists a catalog's channel assignments
  @MessagePattern({ cmd: 'catalogs.channels.list' })
  async list(@Payload() data: { catalogId: string }): Promise<CatalogChannelDto[]> {
    this.logger.log(`catalogs.channels.list — catalogId: ${data.catalogId}`);
    return this.service.listByCatalog(data.catalogId);
  }

  // Assigns a (BU, channel) pair to a catalog
  @MessagePattern({ cmd: 'catalogs.channels.assign' })
  async assign(
    @Payload() data: { catalogId: string; businessUnitId: string; channelId: string },
  ): Promise<CatalogChannelDto> {
    this.logger.log(
      `catalogs.channels.assign — catalogId: ${data.catalogId}, businessUnitId: ${data.businessUnitId}, channelId: ${data.channelId}`,
    );
    return this.service.assign(data);
  }

  // Removes a catalog-channel assignment
  @MessagePattern({ cmd: 'catalogs.channels.unassign' })
  async unassign(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.channels.unassign — id: ${data.id}`);
    return this.service.unassign(data.id);
  }
}
