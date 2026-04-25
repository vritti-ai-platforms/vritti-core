import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLines } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINES_KEY } from './keys';

export function useStockAdjustmentLines(
  adjustmentId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLineData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLineData[], AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId ?? ''),
    queryFn: () => getStockAdjustmentLines(adjustmentId as string),
    enabled: !!adjustmentId,
    ...options,
  });
}
