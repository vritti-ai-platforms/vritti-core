import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { type UpdateGoodsReceiptItemPayload, updateGoodsReceiptItem } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEM_KEY, GOODS_RECEIPT_ITEMS_KEY } from './keys';

export function useUpdateGoodsReceiptItem(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptItemData, AxiosError, UpdateGoodsReceiptItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptItemData, AxiosError, UpdateGoodsReceiptItemPayload>({
    ...options,
    mutationFn: (payload) => updateGoodsReceiptItem(goodsReceiptId, itemId, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEM_KEY(goodsReceiptId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
