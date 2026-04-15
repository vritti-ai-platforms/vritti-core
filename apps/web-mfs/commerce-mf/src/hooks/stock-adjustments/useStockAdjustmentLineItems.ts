import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLineItems } from '@/services/stock-adjustments.service';

export const STOCK_ADJUSTMENT_LINE_ITEMS_KEY = (adjustmentId: string, lineId: string) =>
  ['commerce', 'stock-adjustments', adjustmentId, 'lines', lineId, 'items'] as const;

export function useStockAdjustmentLineItems(
  adjustmentId: string | null,
  lineId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLineItemData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLineItemData[], AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_KEY(adjustmentId ?? '', lineId ?? ''),
    queryFn: () => getStockAdjustmentLineItems(adjustmentId as string, lineId as string),
    enabled: !!adjustmentId && !!lineId,
    ...options,
  });
}
