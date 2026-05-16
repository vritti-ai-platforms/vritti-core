import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLineData } from '@/schemas/goods-receipts';
import { type UpdateGoodsReceiptLinePayload, updateGoodsReceiptLine } from '@/services/goods-receipts.service';
import {
  GOODS_RECEIPT_ITEM_KEY,
  GOODS_RECEIPT_ITEMS_KEY,
  GOODS_RECEIPT_ITEMS_TABLE_KEY,
  GOODS_RECEIPT_KEY,
  GOODS_RECEIPT_LINE_KEY,
  GOODS_RECEIPT_LINES_TABLE_KEY,
  GOODS_RECEIPT_LOTS_KEY,
  GOODS_RECEIPT_TREE_KEY,
} from './keys';

export function useUpdateGoodsReceiptLine(
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptLineData, AxiosError, UpdateGoodsReceiptLinePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptLineData, AxiosError, UpdateGoodsReceiptLinePayload>({
    ...options,
    mutationFn: (data) => updateGoodsReceiptLine(goodsReceiptId, itemId, lineId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINES_TABLE_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINE_KEY(goodsReceiptId, itemId, lineId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LOTS_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEM_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
