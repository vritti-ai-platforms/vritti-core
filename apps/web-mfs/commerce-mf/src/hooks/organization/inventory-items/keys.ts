export const ORG_INVENTORY_ITEMS_TABLE_KEY = ['commerce', 'org', 'inventory-items', 'table'] as const;
export const ORG_INVENTORY_ITEM_KEY = (inventoryItemId: string) =>
  ['commerce', 'org', 'inventory-items', inventoryItemId] as const;
export const ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY = (inventoryItemId: string) =>
  ['commerce', 'org', 'inventory-items', inventoryItemId, 'uom-conversions'] as const;
export const ORG_INVENTORY_ITEM_MRP_KEY = (inventoryItemId: string) =>
  ['commerce', 'org', 'inventory-items', inventoryItemId, 'mrp'] as const;
export const ORG_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY = (inventoryItemId: string) =>
  ['commerce', 'org', 'inventory-items', inventoryItemId, 'suppliers'] as const;
