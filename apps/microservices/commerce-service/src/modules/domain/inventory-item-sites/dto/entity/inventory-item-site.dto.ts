import type { InventoryItemSite, ReplenishmentMethod, SiteItemStatus } from '@/db/schema';

export class InventoryItemSiteDto {
  id: string;
  siteId: string;
  status: SiteItemStatus;
  blockedReason: string | null;
  blockedAt: string | null;
  replenishment: ReplenishmentMethod;
  safetyStock: number | null;
  reorderPoint: number | null;
  maxStock: number | null;
  supplierItemsRequired: boolean;

  // Shapes how a site carries an item: whether its purchasing is blocked, how it is replenished and its levels
  static from(entity: InventoryItemSite): InventoryItemSiteDto {
    const dto = new InventoryItemSiteDto();
    dto.id = entity.id;
    dto.siteId = entity.siteId;
    dto.status = entity.status;
    dto.blockedReason = entity.blockedReason;
    dto.blockedAt = entity.blockedAt?.toISOString() ?? null;
    dto.replenishment = entity.replenishment;
    dto.safetyStock = entity.safetyStock;
    dto.reorderPoint = entity.reorderPoint;
    dto.maxStock = entity.maxStock;
    dto.supplierItemsRequired = entity.supplierItemsRequired;
    return dto;
  }
}
