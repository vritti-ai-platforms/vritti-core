import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import {
  type UpdateStockAdjustmentLineItemPayload,
  updateStockAdjustmentLineItem,
} from '@/services/site/stock-adjustments.service';

export function useUpdateStockAdjustmentLineItem(
  adjustmentId: string,
  lineId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateStockAdjustmentLineItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateStockAdjustmentLineItemPayload>({
    ...options,
    mutationFn: (data) => updateStockAdjustmentLineItem(adjustmentId, lineId, itemId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustmentLineItems, Tables.stockAdjustmentLines]);
      options?.onSuccess?.(...args);
    },
  });
}
