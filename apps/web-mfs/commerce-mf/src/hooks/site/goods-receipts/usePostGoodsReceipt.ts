import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { postGoodsReceipt } from '@/services/site/goods-receipts.service';

// Posts a goods receipt; the received quantities and status of every purchase order it counts move with it
export function usePostGoodsReceipt(
  id: string,
  options?: Omit<UseMutationOptions<GoodsReceiptData, AxiosError, void>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptData, AxiosError, void>({
    ...options,
    mutationFn: () => postGoodsReceipt(id),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.goodsReceipts,
        Tables.goodsReceiptLots,
        Tables.goodsReceiptLines,
        Tables.inventoryItemLots,
        Tables.inventoryItemQuants,
        Tables.inventoryItemSerials,
        Tables.inventoryItemLedger,
        Tables.inventoryItemCosts,
        Tables.inventoryItemQuantCosts,
        Tables.purchaseOrderItems,
        Tables.purchaseOrders,
        Tables.inboundDeliveries,
        Tables.purchaseSuppliers,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
