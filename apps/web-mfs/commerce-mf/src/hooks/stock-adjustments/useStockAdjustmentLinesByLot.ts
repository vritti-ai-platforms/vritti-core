import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLinesByLot } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINES_BY_LOT_KEY } from './keys';

export function useStockAdjustmentLinesByLot(
  adjustmentId: string | null,
  lotId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLineData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLineData[], AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINES_BY_LOT_KEY(adjustmentId ?? '', lotId ?? ''),
    queryFn: () => getStockAdjustmentLinesByLot(adjustmentId as string, lotId as string),
    enabled: !!adjustmentId && !!lotId,
    ...options,
  });
}
