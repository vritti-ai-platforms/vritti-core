import type { EnableInventoryItemSiteDto } from '@domain/inventory-item-sites/dto/request/enable-inventory-item-site.dto';
import { InventoryItemSitesDomainService } from '@domain/inventory-item-sites/services/inventory-item-sites.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { InventoryItemSite } from '@/db/schema';

// Site-scope service for the physical projection writes: enabling a master item at the
// current site and adjusting its reorder point. Reads go straight to the domain service.
@Injectable()
export class SiteInventoryItemsService {
  private readonly logger = new Logger(SiteInventoryItemsService.name);

  constructor(private readonly sitesService: InventoryItemSitesDomainService) {}

  // Enables a master item at the current site
  async enable(siteId: string, dto: EnableInventoryItemSiteDto): Promise<CreateResponseDto<InventoryItemSite>> {
    this.logger.log(`enable — inventoryItemId=${dto.inventoryItemId}, siteId=${siteId}`);
    const entity = await this.sitesService.enable(dto.inventoryItemId, siteId, {
      reorderPoint: dto.reorderPoint,
      maxStockLevel: dto.maxStockLevel,
      safetyStock: dto.safetyStock,
    });
    return { success: true, message: 'Item enabled at this site.', data: entity };
  }

  // Updates the reorder point for an item at the current site
  async updateReorder(siteId: string, inventoryItemId: string, reorderPoint: number): Promise<SuccessResponseDto> {
    this.logger.log(`updateReorder — inventoryItemId=${inventoryItemId}, siteId=${siteId}`);
    await this.sitesService.updateReorder(inventoryItemId, siteId, reorderPoint);
    return { success: true, message: 'Reorder point updated.' };
  }
}
