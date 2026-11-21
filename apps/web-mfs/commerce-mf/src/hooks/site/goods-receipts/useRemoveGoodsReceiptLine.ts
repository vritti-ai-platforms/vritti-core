import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { removeGoodsReceiptLine } from '@/services/site/goods-receipts.service';

// Removes a line with its serials; the receipt and the purchase orders refresh
export function useRemoveGoodsReceiptLine(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (lineId) => removeGoodsReceiptLine(goodsReceiptId, itemId, lineId),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceiptLines, Tables.goodsReceiptLineItems]);
      options?.onSuccess?.(...args);
    },
  });
}
