import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { UpsertPosChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class SitePosCatalogChannelController {
  private readonly logger = new Logger(SitePosCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'site.posCatalogChannels.upsert' })
  upsert(@Payload() dto: UpsertPosChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`posCatalogChannels.upsert — catalogId: ${dto.catalogId}, terminalId: ${dto.terminalId ?? 'any'}`);
    return this.service.upsertPos(dto);
  }
}
