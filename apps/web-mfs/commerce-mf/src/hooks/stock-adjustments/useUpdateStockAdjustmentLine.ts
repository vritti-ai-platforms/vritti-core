import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { type AddStockAdjustmentLinePayload, updateStockAdjustmentLine } from '@/services/stock-adjustments.service';
import { STOCK_ADJUSTMENT_LINES_KEY } from './useStockAdjustmentLines';

export function useUpdateStockAdjustmentLine(
  adjustmentId: string,
  lineId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Partial<AddStockAdjustmentLinePayload>>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Partial<AddStockAdjustmentLinePayload>>({
    ...options,
    mutationFn: (data) => updateStockAdjustmentLine(adjustmentId, lineId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
