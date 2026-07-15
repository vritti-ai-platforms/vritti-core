// Query helper — all site-group inventory-items calls require a set of site ids
export interface SiteGroupInventoryItemsQuery {
  siteIds: string[];
}

// One row per (inventory item, site) in the group availability matrix
export interface SiteGroupInventoryItemData {
  id: string;
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  siteId: string;
  isStocked: boolean;
  reorderPoint: number;
  maxStockLevel: number;
  safetyStock: number;
}

// Availability grouped per item — the sites the item is available at
export interface SiteGroupItemAvailabilityData {
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  siteIds: string[];
}

// Per (item, site) stock levels
export interface SiteGroupItemLevelsData {
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  siteId: string;
  reorderPoint: number;
  maxStockLevel: number;
  safetyStock: number;
}
