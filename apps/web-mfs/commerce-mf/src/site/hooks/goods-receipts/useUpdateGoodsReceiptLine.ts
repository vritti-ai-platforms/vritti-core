import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLineData } from '@/schemas/goods-receipts';
import { type UpdateGoodsReceiptLinePayload, updateGoodsReceiptLine } from '@/site/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY, GOODS_RECEIPT_KEY, GOODS_RECEIPT_TREE_KEY } from './keys';

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
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId), exact: true });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
