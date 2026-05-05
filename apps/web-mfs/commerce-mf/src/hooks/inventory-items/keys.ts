export const INVENTORY_ITEMS_TABLE_KEY = ['commerce', 'inventory-items', 'table'] as const;
export const INVENTORY_ITEM_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId] as const;
export const INVENTORY_ITEM_BATCHES_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'batches'] as const;
export const INVENTORY_ITEM_LOCATIONS_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'locations'] as const;
export const INVENTORY_ITEM_UOM_CONVERSIONS_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'uom-conversions'] as const;
