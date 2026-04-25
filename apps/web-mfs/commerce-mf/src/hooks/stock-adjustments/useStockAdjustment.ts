import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { getStockAdjustment } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_KEY } from './keys';

export function useStockAdjustment(id: string) {
  return useSuspenseQuery<StockAdjustmentData, AxiosError>({
    queryKey: [...STOCK_ADJUSTMENT_KEY(id)],
    queryFn: () => getStockAdjustment(id),
  });
}
