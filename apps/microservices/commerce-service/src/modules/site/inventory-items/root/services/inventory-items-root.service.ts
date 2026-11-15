import type { SetStockLevelsDto } from '@domain/inventory-item-site-stock-levels/dto/request/set-stock-levels.dto';
import type { UpdateStockLevelsDto } from '@domain/inventory-item-site-stock-levels/dto/request/update-stock-levels.dto';
import { InventoryItemSiteStockLevelsDomainService } from '@domain/inventory-item-site-stock-levels/services/inventory-item-site-stock-levels.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { InventoryItemSiteStockLevel } from '@/db/schema';

// Site-scope service for an item's stock levels at the current site: reading, setting, editing and removing them
@Injectable()
export class SiteInventoryItemsService {
  private readonly logger = new Logger(SiteInventoryItemsService.name);

  constructor(private readonly stockLevelsService: InventoryItemSiteStockLevelsDomainService) {}

  // Sets a master item's stock levels at the current site
  async setStockLevels(
    siteId: string,
    dto: SetStockLevelsDto,
  ): Promise<CreateResponseDto<InventoryItemSiteStockLevel>> {
    this.logger.log(`setStockLevels — inventoryItemId=${dto.inventoryItemId}, siteId=${siteId}`);
    const entity = await this.stockLevelsService.setStockLevels(dto.inventoryItemId, siteId, {
      reorderPoint: dto.reorderPoint,
      safetyStock: dto.safetyStock,
      maxStockLevel: dto.maxStockLevel,
    });
    return { success: true, message: 'Stock levels set for this site.', data: entity };
  }

  // Updates an item's stock levels at the current site
  updateStockLevels(siteId: string, dto: UpdateStockLevelsDto): Promise<SuccessResponseDto> {
    this.logger.log(`updateStockLevels — inventoryItemId=${dto.inventoryItemId}, siteId=${siteId}`);
    return this.stockLevelsService.update({ ...dto, siteId });
  }

  // The item's stock levels at the current site, or null while none are set; RLS narrows the item's rows to this site
  async findStockLevels(inventoryItemId: string): Promise<InventoryItemSiteStockLevel | null> {
    const [stockLevels] = await this.stockLevelsService.findByItem(inventoryItemId);
    return stockLevels ?? null;
  }

  // Removes an item's stock levels at the current site, refused while it is held or on an open purchase here
  removeStockLevels(siteId: string, inventoryItemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`removeStockLevels — inventoryItemId=${inventoryItemId}, siteId=${siteId}`);
    return this.stockLevelsService.delete(inventoryItemId, siteId);
  }
}
