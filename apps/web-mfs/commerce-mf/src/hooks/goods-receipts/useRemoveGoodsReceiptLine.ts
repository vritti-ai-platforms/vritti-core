import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { removeGoodsReceiptItem } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY, GOODS_RECEIPT_KEY } from './keys';

export function useRemoveGoodsReceiptItem(
  goodsReceiptId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (itemId) => removeGoodsReceiptItem(goodsReceiptId, itemId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
