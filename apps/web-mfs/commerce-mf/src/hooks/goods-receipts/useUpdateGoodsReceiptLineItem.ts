import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLineItemData } from '@/schemas/goods-receipts';
import { type UpdateGoodsReceiptLineItemPayload, updateGoodsReceiptLineItem } from '@/services/goods-receipts.service';
import {
  GOODS_RECEIPT_LINES_TABLE_KEY,
  GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY,
  GOODS_RECEIPT_LINE_KEY,
  GOODS_RECEIPT_TREE_KEY,
} from './keys';

export function useUpdateGoodsReceiptLineItem(
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  subItemId: string,
  options?: Omit<
    UseMutationOptions<GoodsReceiptLineItemData, AxiosError, UpdateGoodsReceiptLineItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptLineItemData, AxiosError, UpdateGoodsReceiptLineItemPayload>({
    ...options,
    mutationFn: (data) => updateGoodsReceiptLineItem(goodsReceiptId, itemId, lineId, subItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY(goodsReceiptId, itemId, lineId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINE_KEY(goodsReceiptId, itemId, lineId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINES_TABLE_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
