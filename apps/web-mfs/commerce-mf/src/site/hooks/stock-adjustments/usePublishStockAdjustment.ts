import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { publishStockAdjustment } from '@/site/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_KEY, STOCK_ADJUSTMENT_LINES_KEY, STOCK_ADJUSTMENTS_TABLE_KEY } from './keys';

export function usePublishStockAdjustment(
  options?: Omit<UseMutationOptions<StockAdjustmentData, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockAdjustmentData, AxiosError, string>({
    ...options,
    mutationFn: publishStockAdjustment,
    onSuccess: (data, ...rest) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENTS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_KEY(data.id) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(data.id) });
      options?.onSuccess?.(data, ...rest);
    },
  });
}
