import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { UpsertAppChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class OrgAppCatalogChannelController {
  private readonly logger = new Logger(OrgAppCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'org.appCatalogChannels.upsert' })
  upsert(@Payload() dto: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`appCatalogChannels.upsert — catalogId: ${dto.catalogId}, appId: ${dto.appId ?? 'any'}`);
    return this.service.upsertApp(dto);
  }
}
