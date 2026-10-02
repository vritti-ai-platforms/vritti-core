import type { UpsertAppChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SiteAppCatalogChannelGatewayService {
  private readonly logger = new Logger(SiteAppCatalogChannelGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  async upsert(dto: UpsertAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`site.appCatalogChannels.upsert — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'site.appCatalogChannels.upsert', {
      catalogId: dto.catalogId,
      appId: dto.appId ?? null,
    });
  }
}
