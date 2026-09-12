import type { ChannelOverviewDto } from '@domain/catalog-channels/dto/entity/catalog-channel.dto';
import { CatalogChannelsDomainService } from '@domain/catalog-channels/services/catalog-channels.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class SiteCatalogChannelsController {
  private readonly logger = new Logger(SiteCatalogChannelsController.name);

  constructor(private readonly service: CatalogChannelsDomainService) {}

  // What this outlet sells through each channel type, and what it merely inherits
  @MessagePattern({ cmd: 'site.catalogChannels.overview' })
  overview(): Promise<ChannelOverviewDto[]> {
    this.logger.log('catalogChannels.overview');
    return this.service.overview();
  }
}
