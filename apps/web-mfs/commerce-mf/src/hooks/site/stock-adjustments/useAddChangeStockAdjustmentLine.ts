import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { type AddStockAdjustmentLinePayload, addChangeLine } from '@/services/site/stock-adjustments.service';

export function useAddChangeStockAdjustmentLine(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<StockAdjustmentLineData, AxiosError, AddStockAdjustmentLinePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentLineData, AxiosError, AddStockAdjustmentLinePayload>({
    ...options,
    mutationFn: (data) => addChangeLine(adjustmentId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustmentLines]);
      options?.onSuccess?.(...args);
    },
  });
}
