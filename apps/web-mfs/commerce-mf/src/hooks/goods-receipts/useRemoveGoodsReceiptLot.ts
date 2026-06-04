import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { removeGoodsReceiptLot } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY, GOODS_RECEIPT_KEY, GOODS_RECEIPT_LOTS_KEY, GOODS_RECEIPT_TREE_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId), exact: true });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LOTS_KEY(goodsReceiptId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
