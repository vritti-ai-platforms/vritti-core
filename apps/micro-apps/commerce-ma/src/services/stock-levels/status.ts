import type { StockLevel } from '../../types/stock-levels';

export type StockStatus = 'out' | 'low' | 'in';

// Mirrors the web StockLevelsTab logic: no stock when nothing is stocked; low when available is at/below a
// configured reorder level; otherwise in stock.
export function stockStatus(
  s: Pick<StockLevel, 'stockedQuantity' | 'availableQuantity' | 'reorderLevel'>,
): StockStatus {
  if (s.stockedQuantity === 0) return 'out';
  if (s.reorderLevel != null && s.reorderLevel > 0 && s.availableQuantity <= s.reorderLevel) return 'low';
  return 'in';
}
