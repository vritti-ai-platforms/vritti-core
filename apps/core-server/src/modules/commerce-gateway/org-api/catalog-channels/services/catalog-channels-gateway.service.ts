import type { ChannelOverviewResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class CatalogChannelsGatewayService {
  private readonly logger = new Logger(CatalogChannelsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Every type, with the catalog this organization sells and where that came from
  async overview(): Promise<ChannelOverviewResponseDto[]> {
    this.logger.log('org.catalogChannels.overview');
    return this.nats.send('commerce', 'org.catalogChannels.overview', {});
  }
}
