import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { type AddGoodsReceiptItemPayload, addGoodsReceiptItem } from '@/services/goods-receipts.service';
import {
  GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY,
  GOODS_RECEIPT_ITEMS_KEY,
  GOODS_RECEIPT_ITEMS_TABLE_KEY,
  GOODS_RECEIPT_KEY,
  GOODS_RECEIPT_TREE_KEY,
} from './keys';

export function useAddGoodsReceiptItem(
  goodsReceiptId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemPayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptItem(goodsReceiptId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
