export const PURCHASE_ORDERS_KEY = ['commerce', 'le', 'purchase-orders'] as const;
export const PURCHASE_ORDERS_TABLE_KEY = [...PURCHASE_ORDERS_KEY, 'table'] as const;
export const PURCHASE_ORDER_KEY = (id: string) => [...PURCHASE_ORDERS_KEY, id] as const;
export const PURCHASE_ORDER_ITEMS_IDS_KEY = (id: string) => [...PURCHASE_ORDER_KEY(id), 'items', 'ids'] as const;
export const PURCHASE_ORDER_ITEMS_TABLE_KEY = (id: string) => [...PURCHASE_ORDER_KEY(id), 'items', 'table'] as const;
export const PURCHASE_ORDER_GOODS_RECEIPTS_TABLE_KEY = (id: string) =>
  [...PURCHASE_ORDER_KEY(id), 'goods-receipts', 'table'] as const;
export const PURCHASE_ORDER_INBOUND_DELIVERIES_TABLE_KEY = (id: string) =>
  [...PURCHASE_ORDER_KEY(id), 'inbound-deliveries', 'table'] as const;
export const PURCHASE_ORDER_PROBLEMS_KEY = (id: string) => [...PURCHASE_ORDER_KEY(id), 'problems'] as const;
