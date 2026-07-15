import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  SiteGroupInventoryItemDto,
  SiteGroupItemAvailabilityDto,
  SiteGroupItemLevelsDto,
} from '../dto/entity/site-group-inventory-item.dto';

// Site-group scope service: all reads project the item × site availability matrix
// (inventory_item_sites across the group's sites) into the requested shape.
@Injectable()
export class SiteGroupInventoryItemsService {
  private readonly logger = new Logger(SiteGroupInventoryItemsService.name);

  constructor(private readonly inventoryItemsService: InventoryItemsService) {}

  // Full item × site matrix (one cell per enabled pair)
  async findMatrix(siteIds: string[]): Promise<SiteGroupInventoryItemDto[]> {
    this.logger.log(`findMatrix — sites=${siteIds.length}`);
    const rows = await this.inventoryItemsService.findGroupMatrix(siteIds);
    return rows.map((row) => SiteGroupInventoryItemDto.from(row));
  }

  // Availability grouped per item — the set of group sites carrying each item
  async findAvailability(siteIds: string[]): Promise<SiteGroupItemAvailabilityDto[]> {
    this.logger.log(`findAvailability — sites=${siteIds.length}`);
    const rows = await this.inventoryItemsService.findGroupMatrix(siteIds);
    const byItem = new Map<string, { row: (typeof rows)[number]; siteIds: string[] }>();
    for (const row of rows) {
      const entry = byItem.get(row.inventoryItemId);
      if (entry) entry.siteIds.push(row.siteId);
      else byItem.set(row.inventoryItemId, { row, siteIds: [row.siteId] });
    }
    return Array.from(byItem.values()).map(({ row, siteIds: itemSiteIds }) =>
      SiteGroupItemAvailabilityDto.from(row, itemSiteIds),
    );
  }

  // Per-site reorder/max/safety levels across the group
  async findLevels(siteIds: string[]): Promise<SiteGroupItemLevelsDto[]> {
    this.logger.log(`findLevels — sites=${siteIds.length}`);
    const rows = await this.inventoryItemsService.findGroupMatrix(siteIds);
    return rows.map((row) => SiteGroupItemLevelsDto.from(row));
  }
}
