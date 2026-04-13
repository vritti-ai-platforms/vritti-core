import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { getStockAdjustment } from '@/services/stock-adjustments.service';

export const STOCK_ADJUSTMENT_KEY = (id: string) => ['commerce', 'stock-adjustments', id] as const;

export function useStockAdjustment(
  id: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentData, AxiosError>({
    queryKey: [...STOCK_ADJUSTMENT_KEY(id ?? '')],
    queryFn: () => getStockAdjustment(id as string),
    enabled: !!id,
    ...options,
  });
}
