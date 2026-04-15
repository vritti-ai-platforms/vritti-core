import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { addStockAdjustmentLineItem, type AddStockAdjustmentLineItemPayload } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINE_ITEMS_KEY } from './useStockAdjustmentLineItems';
import { STOCK_ADJUSTMENT_LINES_KEY } from './useStockAdjustmentLines';

export function useAddStockAdjustmentLineItem(
  adjustmentId: string,
  lineId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLineItemData, AxiosError, AddStockAdjustmentLineItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentLineItemData, AxiosError, AddStockAdjustmentLineItemPayload>({
    ...options,
    mutationFn: (data) => addStockAdjustmentLineItem(adjustmentId, lineId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_KEY(adjustmentId, lineId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
