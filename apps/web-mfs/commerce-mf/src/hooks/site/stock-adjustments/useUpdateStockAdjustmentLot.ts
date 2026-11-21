import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockAdjustmentLotData } from '@/schemas/stock-adjustments';
import {
  type UpdateStockAdjustmentLotPayload,
  updateStockAdjustmentLot,
} from '@/services/site/stock-adjustments.service';

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
      invalidateWrites(queryClient, [Tables.stockAdjustmentLots]);
      options?.onSuccess?.(...args);
    },
  });
}
