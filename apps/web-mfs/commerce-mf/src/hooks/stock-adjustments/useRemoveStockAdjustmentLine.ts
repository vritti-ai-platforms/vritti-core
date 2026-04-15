import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { removeStockAdjustmentLine } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINES_KEY } from './useStockAdjustmentLines';

export function useRemoveStockAdjustmentLine(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (lineId) => removeStockAdjustmentLine(adjustmentId, lineId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
