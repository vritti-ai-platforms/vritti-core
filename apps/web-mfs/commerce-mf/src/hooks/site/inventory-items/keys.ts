export const INVENTORY_ITEMS_TABLE_KEY = ['commerce', 'inventory-items', 'table'] as const;
export const INVENTORY_ITEM_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId] as const;
export const INVENTORY_ITEM_QUANTS_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'quants'] as const;
export const INVENTORY_ITEM_LOTS_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'lots'] as const;
export const INVENTORY_ITEM_LOCATIONS_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'locations'] as const;
export const INVENTORY_ITEM_STOCKS_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'stocks'] as const;
export const INVENTORY_ITEM_SUPPLIERS_TABLE_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'suppliers'] as const;
export const INVENTORY_ITEM_LEDGER_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'ledger'] as const;
