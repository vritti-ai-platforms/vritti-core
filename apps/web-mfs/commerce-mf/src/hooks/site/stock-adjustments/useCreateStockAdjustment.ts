import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { type CreateStockAdjustmentPayload, createStockAdjustment } from '@/services/site/stock-adjustments.service';

export function useCreateStockAdjustment(
  options?: Omit<UseMutationOptions<StockAdjustmentData, AxiosError, CreateStockAdjustmentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentData, AxiosError, CreateStockAdjustmentPayload>({
    ...options,
    mutationFn: createStockAdjustment,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustments]);
      options?.onSuccess?.(...args);
    },
  });
}
