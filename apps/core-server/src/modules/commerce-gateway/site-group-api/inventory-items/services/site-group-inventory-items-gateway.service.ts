import type { SiteGroupInventoryItemResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-inventory-item-response.dto';
import type { SiteGroupItemAvailabilityResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-item-availability-response.dto';
import type { SiteGroupItemLevelsResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-item-levels-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SiteGroupInventoryItemsGatewayService {
  private readonly logger = new Logger(SiteGroupInventoryItemsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns the full item × site availability matrix across the group's sites
  async findMatrix(siteIds: string[]): Promise<SiteGroupInventoryItemResponseDto[]> {
    this.logger.log(`sg.inventoryItems.table — sites: ${siteIds.length}`);
    return this.nats.send('commerce', 'sg.inventoryItems.table', { siteIds });
  }

  // Returns availability grouped per item — which group sites carry each item
  async findAvailability(siteIds: string[]): Promise<SiteGroupItemAvailabilityResponseDto[]> {
    this.logger.log(`sg.inventoryItems.availability — sites: ${siteIds.length}`);
    return this.nats.send('commerce', 'sg.inventoryItems.availability', { siteIds });
  }

  // Returns per-site reorder/max/safety levels across the group
  async findLevels(siteIds: string[]): Promise<SiteGroupItemLevelsResponseDto[]> {
    this.logger.log(`sg.inventoryItems.levels — sites: ${siteIds.length}`);
    return this.nats.send('commerce', 'sg.inventoryItems.levels', { siteIds });
  }
}
