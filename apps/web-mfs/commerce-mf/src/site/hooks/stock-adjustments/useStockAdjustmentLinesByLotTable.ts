import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLinesTableResponse } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLinesByLotTable } from '@/site/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINES_BY_LOT_TABLE_KEY } from './keys';

export function useStockAdjustmentLinesByLotTable(
  adjustmentId: string | null,
  lotId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLinesTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLinesTableResponse, AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINES_BY_LOT_TABLE_KEY(adjustmentId ?? '', lotId ?? ''),
    queryFn: () => getStockAdjustmentLinesByLotTable(adjustmentId as string, lotId as string),
    enabled: !!adjustmentId && !!lotId,
    ...options,
  });
}
