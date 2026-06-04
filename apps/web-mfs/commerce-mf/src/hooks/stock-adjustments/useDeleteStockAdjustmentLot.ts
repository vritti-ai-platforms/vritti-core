import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteStockAdjustmentLot } from '@/services/stock-adjustments.service';
import {
  STOCK_ADJUSTMENT_KEY,
  STOCK_ADJUSTMENT_LINES_KEY,
  STOCK_ADJUSTMENT_LOTS_KEY,
  STOCK_ADJUSTMENT_TREE_KEY,
} from './keys';

export function useDeleteStockAdjustmentLot(
  adjustmentId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (lotId) => deleteStockAdjustmentLot(adjustmentId, lotId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LOTS_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_KEY(adjustmentId) });
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_TREE_KEY(adjustmentId) });
      options?.onSuccess?.(...args);
    },
  });
}
