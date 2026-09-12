import type { ChannelOverviewResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SiteCatalogChannelsGatewayService {
  private readonly logger = new Logger(SiteCatalogChannelsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Every type, with the catalog this outlet sells and where that came from
  async overview(): Promise<ChannelOverviewResponseDto[]> {
    this.logger.log('site.catalogChannels.overview');
    return this.nats.send('commerce', 'site.catalogChannels.overview', {});
  }
}
