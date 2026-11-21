export const SITE_SUPPLIERS_KEY = ['commerce', 'site', 'suppliers'] as const;
export const SITE_SUPPLIERS_TABLE_KEY = [...SITE_SUPPLIERS_KEY, 'table'] as const;
export const SITE_SUPPLIER_KEY = (id: string) => [...SITE_SUPPLIERS_KEY, id] as const;
export const SITE_SUPPLIER_COUNTS_KEY = (id: string) => [...SITE_SUPPLIER_KEY(id), 'counts'] as const;
export const SITE_SUPPLIER_SITE_ITEMS_TABLE_KEY = (id: string) =>
  [...SITE_SUPPLIER_KEY(id), 'site-items', 'table'] as const;
export const SITE_SUPPLIER_SITE_ITEM_KEY = (id: string, itemId: string) =>
  [...SITE_SUPPLIER_KEY(id), 'site-items', itemId] as const;
export const SITE_SUPPLIER_SITE_ITEM_COUNTS_KEY = (id: string, itemId: string) =>
  [...SITE_SUPPLIER_SITE_ITEM_KEY(id, itemId), 'counts'] as const;
export const SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY = (id: string, itemId: string) =>
  [...SITE_SUPPLIER_SITE_ITEM_KEY(id, itemId), 'prices'] as const;
export const SITE_SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY = (id: string, itemId: string) =>
  [...SITE_SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(id, itemId), 'price-history'] as const;
