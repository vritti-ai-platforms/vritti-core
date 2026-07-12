import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteStockAdjustment } from '@/site/services/stock-adjustments.service';
import { STOCK_ADJUSTMENTS_TABLE_KEY } from './keys';

export function useDeleteStockAdjustment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteStockAdjustment,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
