export const INVENTORY_ITEMS_KEY = ['commerce', 'inventory-items'] as const;
export const INVENTORY_ITEMS_STOCK_TABLE_KEY = ['commerce', 'inventory-items', 'stock-table'] as const;
export const INVENTORY_ITEM_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId] as const;
export const INVENTORY_ITEM_COUNTS_KEY = (inventoryItemId: string) =>
  [...INVENTORY_ITEM_KEY(inventoryItemId), 'counts'] as const;
export const INVENTORY_ITEM_SETUP_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'setup'] as const;
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
export const INVENTORY_ITEM_PRICES_TABLE_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'prices', 'table'] as const;
export const INVENTORY_ITEM_PRICE_HISTORY_KEY = (inventoryItemId: string) =>
  ['commerce', 'inventory-items', inventoryItemId, 'prices', 'history'] as const;
