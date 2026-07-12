import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { type AddStockAdjustmentLinePayload, addOpeningLine } from '@/site/services/stock-adjustments.service';
import {
  STOCK_ADJUSTMENT_KEY,
  STOCK_ADJUSTMENT_LINES_KEY,
  STOCK_ADJUSTMENT_LINES_TABLE_KEY,
  STOCK_ADJUSTMENT_LOTS_KEY,
  STOCK_ADJUSTMENT_TREE_KEY,
} from './keys';

export function useAddOpeningStockAdjustmentLine(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLineData, AxiosError, AddStockAdjustmentLinePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentLineData, AxiosError, AddStockAdjustmentLinePayload>({
    ...options,
    mutationFn: (data) => addOpeningLine(adjustmentId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_TABLE_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LOTS_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_TREE_KEY(adjustmentId) });

      options?.onSuccess?.(...args);
    },
  });
}
