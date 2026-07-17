import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GroupMatrixQueryDto } from './dto/request/group-matrix-query.dto';
import type {
  SiteGroupInventoryItemDto,
  SiteGroupItemAvailabilityDto,
  SiteGroupItemLevelsDto,
} from './dto/entity/site-group-inventory-item.dto';
import { SiteGroupInventoryItemsService } from './services/site-group-inventory-items.service';

@Controller()
export class SiteGroupInventoryItemsController {
  private readonly logger = new Logger(SiteGroupInventoryItemsController.name);

  constructor(private readonly service: SiteGroupInventoryItemsService) {}

  // Full item × site availability matrix across the group's sites
  @MessagePattern({ cmd: 'sg.inventoryItems.table' })
  async table(@Payload() query: GroupMatrixQueryDto): Promise<SiteGroupInventoryItemDto[]> {
    this.logger.log(`inventoryItems.table — sites: ${query.siteIds.length}`);
    return this.service.findMatrix(query.siteIds);
  }

  // Availability grouped per item — which group sites carry each item
  @MessagePattern({ cmd: 'sg.inventoryItems.availability' })
  async availability(@Payload() query: GroupMatrixQueryDto): Promise<SiteGroupItemAvailabilityDto[]> {
    this.logger.log(`inventoryItems.availability — sites: ${query.siteIds.length}`);
    return this.service.findAvailability(query.siteIds);
  }

  // Per-site reorder/max/safety levels across the group
  @MessagePattern({ cmd: 'sg.inventoryItems.levels' })
  async levels(@Payload() query: GroupMatrixQueryDto): Promise<SiteGroupItemLevelsDto[]> {
    this.logger.log(`inventoryItems.levels — sites: ${query.siteIds.length}`);
    return this.service.findLevels(query.siteIds);
  }
}
