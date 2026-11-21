import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentCounts } from '@/schemas/stock-adjustments';
import { getStockAdjustmentCounts } from '@/services/site/stock-adjustments.service';
import { STOCK_ADJUSTMENT_COUNTS_KEY } from './keys';

// Fetches an adjustment's line and draft-lot counts; under its key, so every line and lot mutation refreshes them
export function useStockAdjustmentCounts(id: string) {
  return useQuery<StockAdjustmentCounts, AxiosError>({
    queryKey: STOCK_ADJUSTMENT_COUNTS_KEY(id),
    queryFn: () => getStockAdjustmentCounts(id),
  });
}
