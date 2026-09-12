import type { ChannelOverviewResponseDto } from '@commerce/catalog-channels/dto/response/catalog-channel-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class LeCatalogChannelsGatewayService {
  private readonly logger = new Logger(LeCatalogChannelsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Every type, with the catalog this legal entity sells and where that came from
  async overview(): Promise<ChannelOverviewResponseDto[]> {
    this.logger.log('le.catalogChannels.overview');
    return this.nats.send('commerce', 'le.catalogChannels.overview', {});
  }
}
