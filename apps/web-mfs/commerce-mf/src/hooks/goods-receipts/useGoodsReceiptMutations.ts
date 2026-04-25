import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type {
  GoodsReceiptBatchData,
  GoodsReceiptBatchItemData,
  GoodsReceiptData,
} from '@/schemas/goods-receipts';
import {
  type AddGoodsReceiptBatchItemPayload,
  type AddGoodsReceiptBatchPayload,
  addGoodsReceiptBatch,
  addGoodsReceiptBatchItem,
  deleteGoodsReceipt,
  publishGoodsReceipt,
  removeGoodsReceiptBatch,
  removeGoodsReceiptBatchItem,
  startGoodsReceiptAllocation,
  updateGoodsReceiptBatch,
  updateGoodsReceiptBatchItem,
} from '@/services/goods-receipts.service';
import {
  GOODS_RECEIPT_BATCH_ITEMS_KEY,
  GOODS_RECEIPT_BATCHES_KEY,
  GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY,
  GOODS_RECEIPT_ITEMS_KEY,
  GOODS_RECEIPT_ITEMS_TABLE_KEY,
  GOODS_RECEIPT_KEY,
  GOODS_RECEIPTS_TABLE_KEY,
} from './keys';

function invalidateReceiptHierarchy(queryClient: ReturnType<typeof useQueryClient>, id: string, itemId?: string, batchId?: string) {
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(id) });
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_INVENTORY_ITEM_IDS_KEY(id) });
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_KEY(id) });
  queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(id) });
  if (itemId) {
    queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_BATCHES_KEY(id, itemId) });
  }
  if (itemId && batchId) {
    queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_BATCH_ITEMS_KEY(id, itemId, batchId) });
  }
}

export function useAddGoodsReceiptBatch(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptBatchData, AxiosError, AddGoodsReceiptBatchPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptBatchData, AxiosError, AddGoodsReceiptBatchPayload>({
    ...options,
    mutationFn: (payload) => addGoodsReceiptBatch(goodsReceiptId, itemId, payload),
    onSuccess: (...args) => {
      invalidateReceiptHierarchy(queryClient, goodsReceiptId, itemId);
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateGoodsReceiptBatch(
  goodsReceiptId: string,
  itemId: string,
  batchId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptBatchData, AxiosError, Partial<AddGoodsReceiptBatchPayload>>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptBatchData, AxiosError, Partial<AddGoodsReceiptBatchPayload>>({
    ...options,
    mutationFn: (payload) => updateGoodsReceiptBatch(goodsReceiptId, itemId, batchId, payload),
    onSuccess: (...args) => {
      invalidateReceiptHierarchy(queryClient, goodsReceiptId, itemId, batchId);
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveGoodsReceiptBatch(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (batchId) => removeGoodsReceiptBatch(goodsReceiptId, itemId, batchId),
    onSuccess: (...args) => {
      invalidateReceiptHierarchy(queryClient, goodsReceiptId, itemId);
      options?.onSuccess?.(...args);
    },
  });
}

export function useAddGoodsReceiptBatchItem(
  goodsReceiptId: string,
  itemId: string,
  batchId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptBatchItemData, AxiosError, AddGoodsReceiptBatchItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptBatchItemData, AxiosError, AddGoodsReceiptBatchItemPayload>({
    ...options,
    mutationFn: (payload) => addGoodsReceiptBatchItem(goodsReceiptId, itemId, batchId, payload),
    onSuccess: (...args) => {
      invalidateReceiptHierarchy(queryClient, goodsReceiptId, itemId, batchId);
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateGoodsReceiptBatchItem(
  goodsReceiptId: string,
  itemId: string,
  batchId: string,
  subItemId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptBatchItemData, AxiosError, AddGoodsReceiptBatchItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptBatchItemData, AxiosError, AddGoodsReceiptBatchItemPayload>({
    ...options,
    mutationFn: (payload) => updateGoodsReceiptBatchItem(goodsReceiptId, itemId, batchId, subItemId, payload),
    onSuccess: (...args) => {
      invalidateReceiptHierarchy(queryClient, goodsReceiptId, itemId, batchId);
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveGoodsReceiptBatchItem(
  goodsReceiptId: string,
  itemId: string,
  batchId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (subItemId) => removeGoodsReceiptBatchItem(goodsReceiptId, itemId, batchId, subItemId),
    onSuccess: (...args) => {
      invalidateReceiptHierarchy(queryClient, goodsReceiptId, itemId, batchId);
      options?.onSuccess?.(...args);
    },
  });
}

export function usePublishGoodsReceipt(
  options?: Omit<UseMutationOptions<GoodsReceiptData, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptData, AxiosError, string>({
    ...options,
    mutationFn: publishGoodsReceipt,
    onSuccess: (data, ...args) => {
      invalidateReceiptHierarchy(queryClient, data.id);
      options?.onSuccess?.(data, ...args);
    },
  });
}

export function useStartGoodsReceiptAllocation(
  options?: Omit<UseMutationOptions<GoodsReceiptData, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptData, AxiosError, string>({
    ...options,
    mutationFn: startGoodsReceiptAllocation,
    onSuccess: (data, ...args) => {
      invalidateReceiptHierarchy(queryClient, data.id);
      options?.onSuccess?.(data, ...args);
    },
  });
}

export function useDeleteGoodsReceipt(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteGoodsReceipt,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
