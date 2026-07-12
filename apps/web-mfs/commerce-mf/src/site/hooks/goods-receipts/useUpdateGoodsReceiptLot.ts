import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLotData } from '@/schemas/goods-receipts';
import { type UpdateGoodsReceiptLotPayload, updateGoodsReceiptLot } from '@/site/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY, GOODS_RECEIPT_KEY, GOODS_RECEIPT_LOTS_KEY, GOODS_RECEIPT_TREE_KEY } from './keys';

export function useUpdateGoodsReceiptLot(
  goodsReceiptId: string,
  itemId: string,
  lotId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptLotData, AxiosError, UpdateGoodsReceiptLotPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptLotData, AxiosError, UpdateGoodsReceiptLotPayload>({
    ...options,
    mutationFn: (data) => updateGoodsReceiptLot(goodsReceiptId, itemId, lotId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId), exact: true });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LOTS_KEY(goodsReceiptId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
