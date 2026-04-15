import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLine } from '@/services/stock-adjustments.service';

export const STOCK_ADJUSTMENT_LINE_KEY = (adjustmentId: string, lineId: string) =>
  ['commerce', 'stock-adjustments', adjustmentId, 'lines', lineId] as const;

export function useStockAdjustmentLine(
  adjustmentId: string | null,
  lineId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLineData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLineData, AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINE_KEY(adjustmentId ?? '', lineId ?? ''),
    queryFn: () => getStockAdjustmentLine(adjustmentId as string, lineId as string),
    enabled: !!adjustmentId && !!lineId,
    ...options,
  });
}
