export const PURCHASE_ORDERS_KEY = ['commerce', 'purchase-orders'] as const;
export const PURCHASE_ORDERS_TABLE_KEY = ['commerce', 'purchase-orders', 'table'] as const;
export const PURCHASE_ORDER_KEY = (id: string) => ['commerce', 'purchase-orders', id] as const;
export const PURCHASE_ORDER_ITEMS_IDS_KEY = (id: string) =>
  ['commerce', 'purchase-orders', id, 'items', 'ids'] as const;
export const PURCHASE_ORDER_ITEMS_TABLE_KEY = (id: string) =>
  ['commerce', 'purchase-orders', id, 'items', 'table'] as const;
