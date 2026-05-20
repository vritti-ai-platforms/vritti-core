export const INVENTORY_ITEMS_TABLE_KEY = ['commerce', 'inventory-items', 'table'] as const;
export const INVENTORY_ITEM_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId] as const;
export const INVENTORY_ITEM_QUANTS_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'quants'] as const;
export const INVENTORY_ITEM_LOTS_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'lots'] as const;
export const INVENTORY_ITEM_LOCATIONS_KEY = (itemId: string) =>
  ['commerce', 'inventory-items', itemId, 'locations'] as const;
export const INVENTORY_ITEM_STOCKS_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'stocks'] as const;
export const INVENTORY_ITEM_UOM_CONVERSIONS_KEY = (itemId: string) =>
  ['commerce', 'inventory-items', itemId, 'uom-conversions'] as const;
export const INVENTORY_ITEM_SUPPLIERS_TABLE_KEY = (itemId: string) =>
  ['commerce', 'inventory-items', itemId, 'suppliers'] as const;
export const INVENTORY_ITEM_LEDGER_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'ledger'] as const;
