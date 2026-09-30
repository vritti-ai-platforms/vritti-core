import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { CreateAppChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteAppCatalogChannelController {
  private readonly logger = new Logger(SiteAppCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'site.appCatalogChannels.create' })
  create(@Payload() dto: CreateAppChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`appCatalogChannels.create — catalogId: ${dto.catalogId}, appId: ${dto.appId ?? 'any'}`);
    return this.service.createApp(dto);
  }
}
