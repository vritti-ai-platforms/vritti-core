import type { SiteInventoryItemCounts } from '../../repositories/inventory-items.repository';

export class SiteInventoryItemCountsDto {
  stockLevelCount: number;
  lotCount: number;
  locationCount: number;
  supplierCount: number;
  priceCount: number;
  movementCount: number;
  quantCount: number;

  // Shapes how many rows each tab of a site's inventory item detail page lists
  static from(row: SiteInventoryItemCounts): SiteInventoryItemCountsDto {
    const dto = new SiteInventoryItemCountsDto();
    dto.stockLevelCount = row.stockLevelCount;
    dto.lotCount = row.lotCount;
    dto.locationCount = row.locationCount;
    dto.supplierCount = row.supplierCount;
    dto.priceCount = row.priceCount;
    dto.movementCount = row.movementCount;
    dto.quantCount = row.quantCount;
    return dto;
  }
}
