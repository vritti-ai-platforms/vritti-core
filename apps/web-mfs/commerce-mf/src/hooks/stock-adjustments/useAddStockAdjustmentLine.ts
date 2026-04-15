import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { type AddStockAdjustmentLinePayload, addStockAdjustmentLine } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINES_KEY } from './useStockAdjustmentLines';

export function useAddStockAdjustmentLine(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLineData, AxiosError, AddStockAdjustmentLinePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentLineData, AxiosError, AddStockAdjustmentLinePayload>({
    ...options,
    mutationFn: (data) => addStockAdjustmentLine(adjustmentId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
