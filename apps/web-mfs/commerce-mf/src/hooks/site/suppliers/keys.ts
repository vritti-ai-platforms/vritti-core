export const SITE_SUPPLIERS_KEY = ['commerce', 'site', 'suppliers'] as const;
export const SITE_SUPPLIERS_TABLE_KEY = [...SITE_SUPPLIERS_KEY, 'table'] as const;
export const SITE_SUPPLIER_KEY = (id: string) => [...SITE_SUPPLIERS_KEY, id] as const;
export const SITE_SUPPLIER_ITEMS_TABLE_KEY = (id: string) => [...SITE_SUPPLIER_KEY(id), 'items', 'table'] as const;
export const SITE_SUPPLIER_ITEM_KEY = (id: string, itemId: string) =>
  [...SITE_SUPPLIER_KEY(id), 'items', itemId] as const;
export const SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY = (id: string, itemId: string) =>
  [...SITE_SUPPLIER_ITEM_KEY(id, itemId), 'prices'] as const;
