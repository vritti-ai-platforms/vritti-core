import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLotData } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLots } from '@/site/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LOTS_KEY } from './keys';

export function useStockAdjustmentLots(
  adjustmentId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLotData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLotData[], AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LOTS_KEY(adjustmentId ?? ''),
    queryFn: () => getStockAdjustmentLots(adjustmentId as string),
    enabled: !!adjustmentId,
    ...options,
  });
}
