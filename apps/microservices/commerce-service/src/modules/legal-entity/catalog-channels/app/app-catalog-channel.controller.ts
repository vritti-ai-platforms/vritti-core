import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { UpsertAppChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class LeAppCatalogChannelController {
  private readonly logger = new Logger(LeAppCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'le.appCatalogChannels.upsert' })
  upsert(@Payload() dto: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`appCatalogChannels.upsert — catalogId: ${dto.catalogId}, appId: ${dto.appId ?? 'any'}`);
    return this.service.upsertApp(dto);
  }
}
