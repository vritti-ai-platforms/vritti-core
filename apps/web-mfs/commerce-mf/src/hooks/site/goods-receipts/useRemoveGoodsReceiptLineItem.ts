import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { removeGoodsReceiptLineItem } from '@/services/site/goods-receipts.service';

// Removes a serial from a line; the receipt and the purchase orders refresh
export function useRemoveGoodsReceiptLineItem(
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (serialId) => removeGoodsReceiptLineItem(goodsReceiptId, itemId, lineId, serialId),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceiptLineItems, Tables.goodsReceiptLines]);
      options?.onSuccess?.(...args);
    },
  });
}
