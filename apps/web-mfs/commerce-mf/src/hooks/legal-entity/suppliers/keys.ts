export const SUPPLIERS_KEY = ['commerce', 'le', 'suppliers'] as const;
export const SUPPLIERS_TABLE_KEY = [...SUPPLIERS_KEY, 'table'] as const;

export const SUPPLIER_KEY = (supplierId: string) => [...SUPPLIERS_KEY, supplierId] as const;
export const SUPPLIER_ITEMS_TABLE_KEY = (supplierId: string) =>
  [...SUPPLIER_KEY(supplierId), 'items', 'table'] as const;
export const SUPPLIER_SITES_TABLE_KEY = (supplierId: string) => [...SUPPLIER_KEY(supplierId), 'sites'] as const;

export const SUPPLIER_ITEM_KEY = (supplierId: string, itemId: string) =>
  [...SUPPLIER_KEY(supplierId), 'items', itemId] as const;
export const SUPPLIER_ITEM_PRICES_TABLE_KEY = (supplierId: string, itemId: string) =>
  [...SUPPLIER_ITEM_KEY(supplierId, itemId), 'prices'] as const;
export const SUPPLIER_ITEM_SITES_TABLE_KEY = (supplierId: string, itemId: string) =>
  [...SUPPLIER_ITEM_KEY(supplierId, itemId), 'sites'] as const;

export const SUPPLIER_SITE_KEY = (supplierId: string, siteId: string) =>
  [...SUPPLIER_KEY(supplierId), 'sites', siteId] as const;
export const SUPPLIER_SITE_ITEMS_TABLE_KEY = (supplierId: string, siteId: string) =>
  [...SUPPLIER_SITE_KEY(supplierId, siteId), 'items', 'table'] as const;
export const SUPPLIER_SITE_ITEM_KEY = (supplierId: string, siteId: string, itemId: string) =>
  [...SUPPLIER_SITE_KEY(supplierId, siteId), 'items', itemId] as const;
export const SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY = (supplierId: string, siteId: string, itemId: string) =>
  [...SUPPLIER_SITE_ITEM_KEY(supplierId, siteId, itemId), 'prices'] as const;

export const SUPPLIER_ITEM_PRICE_HISTORY_KEY = (supplierId: string, itemId: string) =>
  [...SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId), 'history'] as const;
export const SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY = (supplierId: string, siteId: string, itemId: string) =>
  [...SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(supplierId, siteId, itemId), 'history'] as const;
