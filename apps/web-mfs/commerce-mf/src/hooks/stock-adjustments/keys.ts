export const STOCK_ADJUSTMENTS_TABLE_KEY = ['commerce', 'stock-adjustments', 'table'] as const;
export const STOCK_ADJUSTMENT_KEY = (id: string) => ['commerce', 'stock-adjustments', id] as const;
export const STOCK_ADJUSTMENT_TREE_KEY = (id: string) => ['commerce', 'stock-adjustments', id, 'tree'] as const;
export const STOCK_ADJUSTMENT_LOTS_KEY = (id: string) => ['commerce', 'stock-adjustments', id, 'lots'] as const;
export const STOCK_ADJUSTMENT_LOT_KEY = (adjustmentId: string, lotId: string) =>
  ['commerce', 'stock-adjustments', adjustmentId, 'lots', lotId] as const;
export const STOCK_ADJUSTMENT_LINES_KEY = (id: string) => ['commerce', 'stock-adjustments', id, 'lines'] as const;
export const STOCK_ADJUSTMENT_LINES_TABLE_KEY = (id: string) =>
  ['commerce', 'stock-adjustments', id, 'lines', 'table'] as const;
export const STOCK_ADJUSTMENT_LINES_BY_LOT_TABLE_KEY = (adjustmentId: string, lotId: string) =>
  ['commerce', 'stock-adjustments', adjustmentId, 'lots', lotId, 'lines', 'table'] as const;
export const STOCK_ADJUSTMENT_LINE_KEY = (adjustmentId: string, lineId: string) =>
  ['commerce', 'stock-adjustments', adjustmentId, 'lines', lineId] as const;
export const STOCK_ADJUSTMENT_LINE_ITEMS_KEY = (adjustmentId: string, lineId: string) =>
  ['commerce', 'stock-adjustments', adjustmentId, 'lines', lineId, 'items'] as const;
export const STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY = (adjustmentId: string, lineId: string) =>
  ['commerce', 'stock-adjustments', adjustmentId, 'lines', lineId, 'items', 'table'] as const;
