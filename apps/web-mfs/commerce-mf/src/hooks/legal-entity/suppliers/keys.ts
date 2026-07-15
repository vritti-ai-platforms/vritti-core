export const SUPPLIERS_KEY = ['commerce', 'le', 'suppliers'] as const;
export const SUPPLIERS_TABLE_KEY = [...SUPPLIERS_KEY, 'table'] as const;

export const SUPPLIER_KEY = (supplierId: string) => [...SUPPLIERS_KEY, supplierId] as const;
export const SUPPLIER_ITEMS_TABLE_KEY = (supplierId: string) =>
  [...SUPPLIER_KEY(supplierId), 'items', 'table'] as const;
export const SUPPLIER_ITEMS_IDS_KEY = (supplierId: string) => [...SUPPLIER_KEY(supplierId), 'items', 'ids'] as const;
export const SUPPLIER_ITEM_IDS_KEY = SUPPLIER_ITEMS_IDS_KEY;
export const SUPPLIER_CONTACTS_KEY = (supplierId: string) => [...SUPPLIER_KEY(supplierId), 'contacts'] as const;
