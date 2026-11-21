import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockAdjustmentLotData } from '@/schemas/stock-adjustments';
import { type AddStockAdjustmentLotPayload, addStockAdjustmentLot } from '@/services/site/stock-adjustments.service';

export function useAddStockAdjustmentLot(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLotData, AxiosError, AddStockAdjustmentLotPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<StockAdjustmentLotData, AxiosError, AddStockAdjustmentLotPayload>({
    ...options,
    mutationFn: (data) => addStockAdjustmentLot(adjustmentId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustmentLots]);
      options?.onSuccess?.(...args);
    },
  });
}
