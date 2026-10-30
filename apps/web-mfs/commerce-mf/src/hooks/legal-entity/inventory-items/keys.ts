export const LE_INVENTORY_ITEMS_KEY = ['commerce', 'le', 'inventory-items'] as const;
export const LE_INVENTORY_ITEMS_TABLE_KEY = [...LE_INVENTORY_ITEMS_KEY, 'table'] as const;
export const LE_INVENTORY_ITEM_KEY = (id: string) => [...LE_INVENTORY_ITEMS_KEY, id] as const;
export const LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY = (id: string) =>
  [...LE_INVENTORY_ITEM_KEY(id), 'suppliers', 'table'] as const;
export const LE_INVENTORY_ITEM_PRICE_GRAPH_KEY = (id: string) =>
  [...LE_INVENTORY_ITEM_KEY(id), 'prices', 'graph'] as const;
export const LE_INVENTORY_ITEM_PRICES_TABLE_KEY = (id: string) =>
  [...LE_INVENTORY_ITEM_KEY(id), 'prices', 'table'] as const;
export const LE_INVENTORY_ITEM_MRP_KEY = (id: string) => [...LE_INVENTORY_ITEM_KEY(id), 'mrp'] as const;
