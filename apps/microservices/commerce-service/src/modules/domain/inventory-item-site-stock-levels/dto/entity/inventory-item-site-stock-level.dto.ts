import type { InventoryItemSiteStockLevel } from '@/db/schema';

export class InventoryItemSiteStockLevelDto {
  id: string;
  siteId: string;
  reorderPoint: number;
  safetyStock: number;
  maxStockLevel: number;

  // Maps an InventoryItemSiteStockLevel entity to an InventoryItemSiteStockLevelDto
  static from(entity: InventoryItemSiteStockLevel): InventoryItemSiteStockLevelDto {
    const dto = new InventoryItemSiteStockLevelDto();
    dto.id = entity.id;
    dto.siteId = entity.siteId;
    dto.reorderPoint = entity.reorderPoint;
    dto.safetyStock = entity.safetyStock;
    dto.maxStockLevel = entity.maxStockLevel;
    return dto;
  }
}
