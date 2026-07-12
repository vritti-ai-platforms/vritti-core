import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLinesTableResponse } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLinesTable } from '@/services/site/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINES_TABLE_KEY } from './keys';

export function useStockAdjustmentLinesTable(
  adjustmentId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLinesTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLinesTableResponse, AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINES_TABLE_KEY(adjustmentId ?? ''),
    queryFn: () => getStockAdjustmentLinesTable(adjustmentId as string),
    enabled: !!adjustmentId,
    ...options,
  });
}
