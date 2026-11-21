import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { removeStockAdjustmentLine } from '@/services/site/stock-adjustments.service';

export function useRemoveStockAdjustmentLine(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (lineId) => removeStockAdjustmentLine(adjustmentId, lineId),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustmentLines, Tables.stockAdjustmentLineItems]);
      options?.onSuccess?.(...args);
    },
  });
}
