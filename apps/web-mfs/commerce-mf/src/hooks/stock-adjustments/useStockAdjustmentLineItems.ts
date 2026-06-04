import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineItemData, StockAdjustmentLineItemsTableResponse } from '@/schemas/stock-adjustments';
import { getStockAdjustmentLineItemsTable } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINE_ITEMS_KEY } from './keys';

// Returns serial entries under a single line. Backed by the existing table endpoint
// (no separate non-table endpoint exists) — we strip pagination and just return the rows.
export function useStockAdjustmentLineItems(
  adjustmentId: string | null,
  lineId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentLineItemData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentLineItemData[], AxiosError>({
    queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_KEY(adjustmentId ?? '', lineId ?? ''),
    queryFn: async () => {
      const res: StockAdjustmentLineItemsTableResponse = await getStockAdjustmentLineItemsTable(
        adjustmentId as string,
        lineId as string,
      );
      return res.result;
    },
    enabled: !!adjustmentId && !!lineId,
    ...options,
  });
}
