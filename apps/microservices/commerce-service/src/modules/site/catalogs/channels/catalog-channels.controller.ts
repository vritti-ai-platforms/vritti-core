import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { AssignCatalogChannelDto } from '@domain/catalogs/dto/request/assign-catalog-channel.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class CatalogChannelsController {
  private readonly logger = new Logger(CatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // Lists a catalog's channel assignments
  @MessagePattern({ cmd: 'site.catalogs.channels.list' })
  async list(@Payload() data: { catalogId: string }): Promise<CatalogChannelDto[]> {
    this.logger.log(`catalogs.channels.list — catalogId: ${data.catalogId}`);
    return this.service.listByCatalog(data.catalogId);
  }

  // Assigns a (site, channel) pair to a catalog
  @MessagePattern({ cmd: 'site.catalogs.channels.assign' })
  async assign(@Payload() dto: AssignCatalogChannelDto): Promise<CatalogChannelDto> {
    this.logger.log(
      `catalogs.channels.assign — catalogId: ${dto.catalogId}, siteId: ${dto.siteId}, channelId: ${dto.channelId}`,
    );
    return this.service.assign(dto);
  }

  // Removes a catalog-channel assignment
  @MessagePattern({ cmd: 'site.catalogs.channels.unassign' })
  async unassign(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`catalogs.channels.unassign — id: ${data.id}`);
    return this.service.unassign(data.id);
  }
}
