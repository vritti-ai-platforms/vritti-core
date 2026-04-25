import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { type AddGoodsReceiptItemPayload, addGoodsReceiptItem } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY, GOODS_RECEIPT_KEY } from './keys';

export function useAddGoodsReceiptItem(
  goodsReceiptId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemPayload>({
    ...options,
    mutationFn: (payload) => addGoodsReceiptItem(goodsReceiptId, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
