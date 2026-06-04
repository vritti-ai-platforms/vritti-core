import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import {
  type AddGoodsReceiptItemFromPurchaseOrderItemPayload,
  type AddGoodsReceiptItemFromSupplierItemPayload,
  addGoodsReceiptItemFromPurchaseOrderItem,
  addGoodsReceiptItemFromSupplierItem,
} from '@/services/goods-receipts.service';
import {
  GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY,
  GOODS_RECEIPT_ITEMS_KEY,
  GOODS_RECEIPT_KEY,
  GOODS_RECEIPT_TREE_KEY,
} from './keys';

function invalidate(queryClient: ReturnType<typeof useQueryClient>, goodsReceiptId: string) {
  // GR record (isPublishable) — exact-only to skip Costs.
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId), exact: true });
  // Items subtree (table + per-item detail + lots/lines under each).
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(goodsReceiptId) });
  // Item-set changed — refetch the cached ID list used by add-item pickers / dedupe checks.
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY(goodsReceiptId) });
  // Breakdown tree.
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(goodsReceiptId) });
}

export function useAddGoodsReceiptItemFromSupplierItem(
  goodsReceiptId: string,
  options?: Omit<
    UseMutationOptions<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemFromSupplierItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemFromSupplierItemPayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptItemFromSupplierItem(goodsReceiptId, data),
    onSuccess: (...args) => {
      invalidate(queryClient, goodsReceiptId);
      options?.onSuccess?.(...args);
    },
  });
}

export function useAddGoodsReceiptItemFromPurchaseOrderItem(
  goodsReceiptId: string,
  options?: Omit<
    UseMutationOptions<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemFromPurchaseOrderItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptItemData, AxiosError, AddGoodsReceiptItemFromPurchaseOrderItemPayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptItemFromPurchaseOrderItem(goodsReceiptId, data),
    onSuccess: (...args) => {
      invalidate(queryClient, goodsReceiptId);
      options?.onSuccess?.(...args);
    },
  });
}
