import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLotData } from '@/schemas/stock-adjustments';
import { type UpdateStockAdjustmentLotPayload, updateStockAdjustmentLot } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_KEY, STOCK_ADJUSTMENT_LOTS_KEY, STOCK_ADJUSTMENT_TREE_KEY } from './keys';

export function useUpdateStockAdjustmentLot(
  adjustmentId: string,
  lotId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLotData, AxiosError, UpdateStockAdjustmentLotPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<StockAdjustmentLotData, AxiosError, UpdateStockAdjustmentLotPayload>({
    ...options,
    mutationFn: (data) => updateStockAdjustmentLot(adjustmentId, lotId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LOTS_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_TREE_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
