export interface SiteGroupInventoryItemsQuery {
  siteIds: string[];
}

export interface SiteGroupInventoryItemData {
  id: string;
  inventoryItemId: string;
  itemName: string;
  itemSku: string;
  siteId: string;
  isStocked: boolean;
  reorderPoint: number;
  maxStockLevel: number;
  safetyStock: number;
}

export interface SiteGroupItemAvailabilityData {
  inventoryItemId: string;
  itemName: string;
  itemSku: string;
  siteIds: string[];
}

export interface SiteGroupItemLevelsData {
  inventoryItemId: string;
  itemName: string;
  itemSku: string;
  siteId: string;
  reorderPoint: number;
  maxStockLevel: number;
  safetyStock: number;
}
