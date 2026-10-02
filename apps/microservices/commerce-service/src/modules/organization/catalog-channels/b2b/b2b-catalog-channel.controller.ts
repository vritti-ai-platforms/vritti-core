import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { UpsertB2bChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class OrgB2bCatalogChannelController {
  private readonly logger = new Logger(OrgB2bCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'org.b2bCatalogChannels.upsert' })
  upsert(@Payload() dto: UpsertB2bChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`b2bCatalogChannels.upsert — catalogId: ${dto.catalogId}`);
    return this.service.upsertB2b(dto);
  }
}
