import type { AxiosError } from 'axios';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { type UpdateStockAdjustmentPayload, updateStockAdjustment } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_KEY } from './useStockAdjustment';
import { STOCK_ADJUSTMENT_LINES_KEY } from './useStockAdjustmentLines';

export function useUpdateStockAdjustment(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentData, AxiosError, UpdateStockAdjustmentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentData, AxiosError, UpdateStockAdjustmentPayload>({
    mutationFn: (data) => updateStockAdjustment(adjustmentId, data),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
