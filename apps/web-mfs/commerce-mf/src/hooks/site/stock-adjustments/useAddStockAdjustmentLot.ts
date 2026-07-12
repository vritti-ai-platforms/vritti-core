import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentLotData } from '@/schemas/stock-adjustments';
import { type AddStockAdjustmentLotPayload, addStockAdjustmentLot } from '@/services/site/stock-adjustments.service';
import { STOCK_ADJUSTMENT_KEY, STOCK_ADJUSTMENT_LOTS_KEY, STOCK_ADJUSTMENT_TREE_KEY } from './keys';

export function useAddStockAdjustmentLot(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLotData, AxiosError, AddStockAdjustmentLotPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<StockAdjustmentLotData, AxiosError, AddStockAdjustmentLotPayload>({
    ...options,
    mutationFn: (data) => addStockAdjustmentLot(adjustmentId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LOTS_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_TREE_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
