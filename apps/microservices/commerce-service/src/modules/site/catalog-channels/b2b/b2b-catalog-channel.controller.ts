import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { CreateB2bChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SiteB2bCatalogChannelController {
  private readonly logger = new Logger(SiteB2bCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'site.b2bCatalogChannels.create' })
  create(@Payload() dto: CreateB2bChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`b2bCatalogChannels.create — catalogId: ${dto.catalogId}`);
    return this.service.createB2b(dto);
  }
}
