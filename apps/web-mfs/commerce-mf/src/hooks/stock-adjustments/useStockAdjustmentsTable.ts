import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentsTableResponse } from '@/schemas/stock-adjustments';
import { getStockAdjustmentsTable } from '@/services/stock-adjustments.service';

export const STOCK_ADJUSTMENTS_TABLE_KEY = ['commerce', 'stock-adjustments', 'table'] as const;

export function useStockAdjustmentsTable(
  options?: Omit<UseQueryOptions<StockAdjustmentsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<StockAdjustmentsTableResponse, AxiosError>({
    queryKey: [...STOCK_ADJUSTMENTS_TABLE_KEY],
    queryFn: getStockAdjustmentsTable,
    ...options,
  });
}
