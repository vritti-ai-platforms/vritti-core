import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { type UpdateGoodsReceiptItemPayload, updateGoodsReceiptItem } from '@/services/goods-receipts.service';
import {
  GOODS_RECEIPT_ITEM_KEY,
  GOODS_RECEIPT_ITEMS_KEY,
  GOODS_RECEIPT_ITEMS_TABLE_KEY,
  GOODS_RECEIPT_KEY,
  GOODS_RECEIPT_TREE_KEY,
} from './keys';

export function useUpdateGoodsReceiptItem(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateGoodsReceiptItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateGoodsReceiptItemPayload>({
    ...options,
    mutationFn: (data) => updateGoodsReceiptItem(goodsReceiptId, itemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEM_KEY(goodsReceiptId, itemId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
