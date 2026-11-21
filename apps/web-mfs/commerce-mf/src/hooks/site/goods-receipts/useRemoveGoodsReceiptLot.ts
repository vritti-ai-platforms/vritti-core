import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { removeGoodsReceiptLot } from '@/services/site/goods-receipts.service';

// Removes a lot with its lines and serials; the receipt and the purchase orders refresh
export function useRemoveGoodsReceiptLot(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (lotId) => removeGoodsReceiptLot(goodsReceiptId, itemId, lotId),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceiptLots, Tables.goodsReceiptLines, Tables.goodsReceiptLineItems]);
      options?.onSuccess?.(...args);
    },
  });
}
