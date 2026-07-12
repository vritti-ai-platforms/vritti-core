import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { type CreateStockAdjustmentPayload, createStockAdjustment } from '@/services/site/stock-adjustments.service';
import { STOCK_ADJUSTMENTS_TABLE_KEY } from './keys';

export function useCreateStockAdjustment(
  options?: Omit<UseMutationOptions<StockAdjustmentData, AxiosError, CreateStockAdjustmentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentData, AxiosError, CreateStockAdjustmentPayload>({
    ...options,
    mutationFn: createStockAdjustment,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
