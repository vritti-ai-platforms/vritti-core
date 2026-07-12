export const STOCK_TRANSFERS_KEY = ['commerce', 'stock-transfers'] as const;
export const STOCK_TRANSFERS_TABLE_KEY = [...STOCK_TRANSFERS_KEY, 'table'] as const;
export const STOCK_TRANSFER_KEY = (id: string) => [...STOCK_TRANSFERS_KEY, id] as const;
