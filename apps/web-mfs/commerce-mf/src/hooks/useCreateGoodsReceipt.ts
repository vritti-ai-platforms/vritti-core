import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/purchase-orders';
import { type CreateGoodsReceiptPayload, createGoodsReceipt } from '@/services/purchase-orders.service';
import { PURCHASE_ORDERS_TABLE_KEY } from './usePurchaseOrdersTable';

// Creates a goods receipt and invalidates PO detail + table
export function useCreateGoodsReceipt(
  purchaseOrderId: string,
  options?: Omit<UseMutationOptions<GoodsReceiptData, AxiosError, CreateGoodsReceiptPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<GoodsReceiptData, AxiosError, CreateGoodsReceiptPayload>({
    ...options,
    mutationFn: createGoodsReceipt,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'purchase-orders', purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'goods-receipts', purchaseOrderId] });
      options?.onSuccess?.(...args);
    },
  });
}
