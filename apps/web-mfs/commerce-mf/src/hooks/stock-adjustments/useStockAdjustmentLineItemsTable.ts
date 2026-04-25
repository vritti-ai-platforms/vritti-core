import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineItemsTableResponse } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLineItemsTable } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY } from './keys';

export function useStockAdjustmentLineItemsTable(
  adjustmentId: string | null,
  lineId: string | null,
  options?: Omit<
    UseQueryOptions<StockAdjustmentLineItemsTableResponse, AxiosError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery<StockAdjustmentLineItemsTableResponse, AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustmentId ?? '', lineId ?? ''),
    queryFn: () => getStockAdjustmentLineItemsTable(adjustmentId as string, lineId as string),
    enabled: !!adjustmentId && !!lineId,
    ...options,
  });
}
