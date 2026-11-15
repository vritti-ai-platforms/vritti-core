import type { StockLevel } from '../../../types/stock-levels';

export const StockStatusValues = {
  OUT: 'out',
  IN: 'in',
} as const;

export type StockStatus = (typeof StockStatusValues)[keyof typeof StockStatusValues];

// No stock when nothing is stocked; otherwise in stock. Reorder thresholds are a site-level setting, not per location.
export function stockStatus(s: Pick<StockLevel, 'stockedQuantity'>): StockStatus {
  return s.stockedQuantity === 0 ? StockStatusValues.OUT : StockStatusValues.IN;
}
