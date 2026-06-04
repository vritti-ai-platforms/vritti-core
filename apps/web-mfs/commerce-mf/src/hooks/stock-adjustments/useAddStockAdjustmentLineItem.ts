import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import {
  type AddStockAdjustmentLineItemPayload,
  addStockAdjustmentLineItem,
} from '@/services/stock-adjustments.service';
import {
  STOCK_ADJUSTMENT_KEY,
  STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY,
  STOCK_ADJUSTMENT_LINE_KEY,
  STOCK_ADJUSTMENT_LINES_KEY,
  STOCK_ADJUSTMENT_LOTS_KEY,
  STOCK_ADJUSTMENT_TREE_KEY,
} from './keys';

export function useAddStockAdjustmentLineItem(
  adjustmentId: string,
  lineId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<StockAdjustmentLineItemData>, AxiosError, AddStockAdjustmentLineItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<StockAdjustmentLineItemData>, AxiosError, AddStockAdjustmentLineItemPayload>({
    ...options,
    mutationFn: (data) => addStockAdjustmentLineItem(adjustmentId, lineId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustmentId, lineId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_KEY(adjustmentId, lineId), exact: true });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId), exact: true });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LOTS_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_TREE_KEY(adjustmentId), exact: true });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_KEY(adjustmentId), exact: true });

      options?.onSuccess?.(...args);
    },
  });
}
