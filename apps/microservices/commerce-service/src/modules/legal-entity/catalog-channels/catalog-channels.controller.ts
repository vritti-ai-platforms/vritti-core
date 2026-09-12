import type { ChannelOverviewDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';

@Controller()
export class LeCatalogChannelsController {
  private readonly logger = new Logger(LeCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // What this legal entity sells through each channel type, and what it merely inherits
  @MessagePattern({ cmd: 'le.catalogChannels.overview' })
  overview(): Promise<ChannelOverviewDto[]> {
    this.logger.log('catalogChannels.overview');
    return this.service.overview();
  }
}
