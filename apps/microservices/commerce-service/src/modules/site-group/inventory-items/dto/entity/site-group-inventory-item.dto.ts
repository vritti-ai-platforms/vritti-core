import type { InventoryItemSite } from '@/db/schema';

type MatrixRow = InventoryItemSite & { itemName: string; itemCode: string };

// One (item, site) cell of the group matrix — enablement + per-site stock levels.
export class SiteGroupInventoryItemDto {
  id: string;
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  siteId: string;
  isStocked: boolean;
  reorderPoint: number;
  maxStockLevel: number;
  safetyStock: number;

  static from(row: MatrixRow): SiteGroupInventoryItemDto {
    const dto = new SiteGroupInventoryItemDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.itemName = row.itemName;
    dto.itemCode = row.itemCode;
    dto.siteId = row.siteId;
    dto.isStocked = row.isStocked;
    dto.reorderPoint = row.reorderPoint;
    dto.maxStockLevel = row.maxStockLevel;
    dto.safetyStock = row.safetyStock;
    return dto;
  }
}

// Availability projection — the set of sites (within the group) that carry an item.
export class SiteGroupItemAvailabilityDto {
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  siteIds: string[];

  static from(row: MatrixRow, siteIds: string[]): SiteGroupItemAvailabilityDto {
    const dto = new SiteGroupItemAvailabilityDto();
    dto.inventoryItemId = row.inventoryItemId;
    dto.itemName = row.itemName;
    dto.itemCode = row.itemCode;
    dto.siteIds = siteIds;
    return dto;
  }
}

// Per-site reorder/max/safety levels for an item across the group.
export class SiteGroupItemLevelsDto {
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  siteId: string;
  reorderPoint: number;
  maxStockLevel: number;
  safetyStock: number;

  static from(row: MatrixRow): SiteGroupItemLevelsDto {
    const dto = new SiteGroupItemLevelsDto();
    dto.inventoryItemId = row.inventoryItemId;
    dto.itemName = row.itemName;
    dto.itemCode = row.itemCode;
    dto.siteId = row.siteId;
    dto.reorderPoint = row.reorderPoint;
    dto.maxStockLevel = row.maxStockLevel;
    dto.safetyStock = row.safetyStock;
    return dto;
  }
}
