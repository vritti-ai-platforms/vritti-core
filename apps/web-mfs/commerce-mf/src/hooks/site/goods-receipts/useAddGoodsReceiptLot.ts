import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLotData } from '@/schemas/goods-receipts';
import { type AddGoodsReceiptLotPayload, addGoodsReceiptLot } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY, GOODS_RECEIPT_KEY, GOODS_RECEIPT_LOTS_KEY, GOODS_RECEIPT_TREE_KEY } from './keys';

export function useAddGoodsReceiptLot(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptLotData, AxiosError, AddGoodsReceiptLotPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptLotData, AxiosError, AddGoodsReceiptLotPayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptLot(goodsReceiptId, itemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId), exact: true });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LOTS_KEY(goodsReceiptId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
