import type { CatalogChannelDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { CreatePosChannelDto } from '@domain/catalog-channels/dto/request/upsert-catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class OrgPosCatalogChannelController {
  private readonly logger = new Logger(OrgPosCatalogChannelController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  @MessagePattern({ cmd: 'org.posCatalogChannels.create' })
  create(@Payload() dto: CreatePosChannelDto): Promise<CreateResponseDto<CatalogChannelDto>> {
    this.logger.log(`posCatalogChannels.create — catalogId: ${dto.catalogId}, terminalId: ${dto.terminalId ?? 'any'}`);
    return this.service.createPos(dto);
  }
}
