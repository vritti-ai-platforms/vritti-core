import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { removeGoodsReceiptItem } from '@/services/legal-entity/goods-receipts.service';

// Removes an item with its lots, lines and serials; the receipt and the purchase orders refresh
export function useRemoveGoodsReceiptItem(
  goodsReceiptId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (itemId) => removeGoodsReceiptItem(goodsReceiptId, itemId),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.goodsReceiptItems,
        Tables.goodsReceiptLots,
        Tables.goodsReceiptLines,
        Tables.goodsReceiptLineItems,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
