import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { removeStockAdjustmentLineItem } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY, STOCK_ADJUSTMENT_LINE_KEY, STOCK_ADJUSTMENT_LINES_KEY } from './keys';

export function useRemoveStockAdjustmentLineItem(
  adjustmentId: string,
  lineId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (itemId) => removeStockAdjustmentLineItem(adjustmentId, lineId, itemId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustmentId, lineId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_KEY(adjustmentId, lineId) });
      options?.onSuccess?.(...args);
    },
  });
}
