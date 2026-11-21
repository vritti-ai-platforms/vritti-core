import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { type UpdateStockAdjustmentPayload, updateStockAdjustment } from '@/services/site/stock-adjustments.service';

export function useUpdateStockAdjustment(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentData, AxiosError, UpdateStockAdjustmentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentData, AxiosError, UpdateStockAdjustmentPayload>({
    mutationFn: (data) => updateStockAdjustment(adjustmentId, data),
    ...options,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustments]);
      options?.onSuccess?.(...args);
    },
  });
}
