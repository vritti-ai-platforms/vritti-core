import type { SiteGroupInventoryItemResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-inventory-item-response.dto';
import type {
  SiteGroupInventoryItemTableResponseDto,
  SiteGroupInventoryItemTableRowDto,
} from '@commerce/site-group-inventory-items/dto/response/site-group-inventory-item-table-response.dto';
import type { SiteGroupItemAvailabilityResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-item-availability-response.dto';
import type { SiteGroupItemLevelsResponseDto } from '@commerce/site-group-inventory-items/dto/response/site-group-item-levels-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SiteGroupInventoryItemsGatewayService {
  private readonly logger = new Logger(SiteGroupInventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns every master item with how many of the group's sites have it enabled
  async findForTable(userId: string): Promise<SiteGroupInventoryItemTableResponseDto> {
    this.logger.log('sg.inventoryItems.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-site-group-inventory-items',
    );

    const { result, count } = await this.nats.send<{ result: SiteGroupInventoryItemTableRowDto[]; count: number }>(
      'commerce',
      'sg.inventoryItems.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns the full item × site availability matrix across the group's sites
  async findMatrix(siteIds: string[]): Promise<SiteGroupInventoryItemResponseDto[]> {
    this.logger.log(`sg.inventoryItems.matrix — sites: ${siteIds.length}`);
    return this.nats.send('commerce', 'sg.inventoryItems.matrix', { siteIds });
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
