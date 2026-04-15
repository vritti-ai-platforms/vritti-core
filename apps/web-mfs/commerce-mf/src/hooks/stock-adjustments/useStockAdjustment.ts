import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { getStockAdjustment } from '@/services/stock-adjustments.service';

export const STOCK_ADJUSTMENT_KEY = (id: string) => ['commerce', 'stock-adjustments', id] as const;

export function useStockAdjustment(id: string) {
  return useSuspenseQuery<StockAdjustmentData, AxiosError>({
    queryKey: [...STOCK_ADJUSTMENT_KEY(id)],
    queryFn: () => getStockAdjustment(id),
  });
}
