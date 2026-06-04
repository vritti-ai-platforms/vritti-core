export const ORDERS_KEY = ['commerce', 'orders'] as const;
export const ORDERS_TABLE_KEY = [...ORDERS_KEY, 'table'] as const;
export const ORDER_KEY = (id: string) => [...ORDERS_KEY, id] as const;
