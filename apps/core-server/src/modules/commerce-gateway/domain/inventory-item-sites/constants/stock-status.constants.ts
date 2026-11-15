export const STOCK_STATUSES = ['OUT_OF_STOCK', 'BELOW_SAFETY_STOCK', 'REORDER', 'HEALTHY', 'OVER_MAX'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];
