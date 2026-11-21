import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteStockAdjustment } from '@/services/site/stock-adjustments.service';

export function useDeleteStockAdjustment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteStockAdjustment,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.stockAdjustments,
        Tables.stockAdjustmentLines,
        Tables.stockAdjustmentLots,
        Tables.stockAdjustmentLineItems,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
