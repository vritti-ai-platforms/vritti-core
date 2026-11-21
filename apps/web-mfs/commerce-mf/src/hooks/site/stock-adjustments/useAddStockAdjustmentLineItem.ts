import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import {
  type AddStockAdjustmentLineItemPayload,
  addStockAdjustmentLineItem,
} from '@/services/site/stock-adjustments.service';

export function useAddStockAdjustmentLineItem(
  adjustmentId: string,
  lineId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<StockAdjustmentLineItemData>, AxiosError, AddStockAdjustmentLineItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<StockAdjustmentLineItemData>, AxiosError, AddStockAdjustmentLineItemPayload>({
    ...options,
    mutationFn: (data) => addStockAdjustmentLineItem(adjustmentId, lineId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockAdjustmentLineItems, Tables.stockAdjustmentLines]);
      options?.onSuccess?.(...args);
    },
  });
}
