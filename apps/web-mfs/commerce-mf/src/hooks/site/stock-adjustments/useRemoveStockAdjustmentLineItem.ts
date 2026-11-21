import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { removeStockAdjustmentLineItem } from '@/services/site/stock-adjustments.service';

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
      invalidateWrites(queryClient, [Tables.stockAdjustmentLineItems, Tables.stockAdjustmentLines]);
      options?.onSuccess?.(...args);
    },
  });
}
