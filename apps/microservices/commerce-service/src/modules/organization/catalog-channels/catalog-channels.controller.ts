import type {
  CatalogChannelDto,
  ChannelOverviewDto,
  ChannelResolutionDto,
} from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { ResolveCatalogChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class OrgCatalogChannelsController {
  private readonly logger = new Logger(OrgCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // What this organization sells through each channel type
  @MessagePattern({ cmd: 'org.catalogChannels.overview' })
  overview(): Promise<ChannelOverviewDto[]> {
    this.logger.log('catalogChannels.overview');
    return this.service.overview();
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
}
