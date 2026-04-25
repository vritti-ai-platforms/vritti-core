export const STOCK_ADJUSTMENTS_TABLE_KEY = ['commerce', 'stock-adjustments', 'table'] as const;
export const STOCK_ADJUSTMENT_KEY = (id: string) => ['commerce', 'stock-adjustments', id] as const;
export const STOCK_ADJUSTMENT_LINES_KEY = (id: string) => ['commerce', 'stock-adjustments', id, 'lines'] as const;
export const STOCK_ADJUSTMENT_LINE_KEY = (adjustmentId: string, lineId: string) => ['commerce', 'stock-adjustments', adjustmentId, 'lines', lineId] as const;
export const STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY = (adjustmentId: string, lineId: string) => ['commerce', 'stock-adjustments', adjustmentId, 'lines', lineId, 'items', 'table'] as const;
