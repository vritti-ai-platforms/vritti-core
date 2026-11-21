import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { type UpdateStockAdjustmentLinePayload, updateChangeLine } from '@/services/site/stock-adjustments.service';

export function useUpdateChangeStockAdjustmentLine(
  adjustmentId: string,
  lineId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateStockAdjustmentLinePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateStockAdjustmentLinePayload>({
    ...options,
    mutationFn: (data) => updateChangeLine(adjustmentId, lineId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustmentLines]);
      options?.onSuccess?.(...args);
    },
  });
}
