import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { type CreateGoodsReceiptPayload, createGoodsReceipt } from '@/services/goods-receipts.service';
import {
  PURCHASE_ORDER_ITEMS_KEY,
  PURCHASE_ORDER_ITEMS_TABLE_KEY,
  PURCHASE_ORDER_KEY,
  PURCHASE_ORDERS_TABLE_KEY,
} from './purchase-orders';
import { GOODS_RECEIPTS_KEY } from './useGoodsReceipts';
import { GOODS_RECEIPTS_TABLE_KEY } from './useGoodsReceiptsTable';

// Creates a goods receipt and invalidates PO detail + table
export function useCreateGoodsReceipt(
  purchaseOrderId: string | null = null,
  options?: Omit<UseMutationOptions<GoodsReceiptData, AxiosError, CreateGoodsReceiptPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<GoodsReceiptData, AxiosError, CreateGoodsReceiptPayload>({
    ...options,
    mutationFn: createGoodsReceipt,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      if (purchaseOrderId) {
        queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(purchaseOrderId) });
        queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_KEY(purchaseOrderId) });
        queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_TABLE_KEY(purchaseOrderId) });
        queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_KEY(purchaseOrderId) });
      }
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
