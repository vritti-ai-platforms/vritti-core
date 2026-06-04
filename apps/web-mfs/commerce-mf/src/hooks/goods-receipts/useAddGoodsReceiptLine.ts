import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptLineData } from '@/schemas/goods-receipts';
import { type AddGoodsReceiptLinePayload, addGoodsReceiptLine } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY, GOODS_RECEIPT_KEY, GOODS_RECEIPT_TREE_KEY } from './keys';

export function useAddGoodsReceiptLine(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptLineData, AxiosError, AddGoodsReceiptLinePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptLineData, AxiosError, AddGoodsReceiptLinePayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptLine(goodsReceiptId, itemId, data),
    onSuccess: (...args) => {
      // GR record (isPublishable flag, exact-only to skip costs / inventory-item-ids).
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId), exact: true });
      // Items subtree (table + per-item detail + lots + lines tables + line detail).
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
      // Breakdown tree (item / lot / line badges + balance).
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
      options?.onSuccess?.(...args);
    },
  });
}
