import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { publishStockAdjustment } from '@/services/site/stock-adjustments.service';

export function usePublishStockAdjustment(
  options?: Omit<UseMutationOptions<StockAdjustmentData, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentData, AxiosError, string>({
    ...options,
    mutationFn: publishStockAdjustment,
    onSuccess: (data, ...rest) => {
      invalidateWrites(queryClient, [
        Tables.stockAdjustments,
        Tables.stockAdjustmentLines,
        Tables.stockAdjustmentLots,
        Tables.inventoryItemLots,
        Tables.inventoryItemQuants,
        Tables.inventoryItemSerials,
        Tables.inventoryItemCosts,
        Tables.inventoryItemQuantCosts,
        Tables.inventoryItemLedger,
      ]);
      options?.onSuccess?.(data, ...rest);
    },
  });
}
