import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import {
  type AddStockAdjustmentLineItemPayload,
  updateStockAdjustmentLineItem,
} from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY } from './useStockAdjustmentLineItemsTable';
import { STOCK_ADJUSTMENT_LINES_KEY } from './useStockAdjustmentLines';

export function useUpdateStockAdjustmentLineItem(
  adjustmentId: string,
  lineId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLineItemData, AxiosError, AddStockAdjustmentLineItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentLineItemData, AxiosError, AddStockAdjustmentLineItemPayload>({
    ...options,
    mutationFn: (data) => updateStockAdjustmentLineItem(adjustmentId, lineId, itemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustmentId, lineId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
