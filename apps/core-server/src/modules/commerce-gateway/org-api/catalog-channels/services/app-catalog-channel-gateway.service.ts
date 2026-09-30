import type { CreateAppChannelDto } from '@commerce/catalog-channels/dto/request/app-channel.dto';
import type { CatalogChannelResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class AppCatalogChannelGatewayService {
  private readonly logger = new Logger(AppCatalogChannelGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  async create(dto: CreateAppChannelDto): Promise<CreateResponseDto<CatalogChannelResponseDto>> {
    this.logger.log(`org.appCatalogChannels.create — catalogId: ${dto.catalogId}`);
    return this.nats.send('commerce', 'org.appCatalogChannels.create', {
      catalogId: dto.catalogId,
      appId: dto.appId ?? null,
    });
  }
}
