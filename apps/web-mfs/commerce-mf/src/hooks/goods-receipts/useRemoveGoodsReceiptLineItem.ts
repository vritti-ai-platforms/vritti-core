import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { removeGoodsReceiptLineItem } from '@/services/goods-receipts.service';
import {
  GOODS_RECEIPT_ITEM_KEY,
  GOODS_RECEIPT_KEY,
  GOODS_RECEIPT_LINES_TABLE_KEY,
  GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY,
  GOODS_RECEIPT_LINE_KEY,
  GOODS_RECEIPT_LOTS_KEY,
  GOODS_RECEIPT_TREE_KEY,
} from './keys';

export function useRemoveGoodsReceiptLineItem(
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (subItemId) => removeGoodsReceiptLineItem(goodsReceiptId, itemId, lineId, subItemId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY(goodsReceiptId, itemId, lineId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINE_KEY(goodsReceiptId, itemId, lineId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINES_TABLE_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LOTS_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEM_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
