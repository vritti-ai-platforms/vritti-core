import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { type UpdateStockAdjustmentPayload, updateStockAdjustment } from '@/site/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_KEY, STOCK_ADJUSTMENT_LINES_KEY } from './keys';

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
