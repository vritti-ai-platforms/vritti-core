import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { INBOUND_DELIVERIES_KEY } from '@/hooks/site/inbound-deliveries/keys';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { publishGoodsReceipt } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPT_KEY, GOODS_RECEIPTS_TABLE_KEY } from './keys';

// Publishes a goods receipt; the received quantities and status of every purchase order it counts move with it
export function usePublishGoodsReceipt(
  id: string,
  options?: Omit<UseMutationOptions<GoodsReceiptData, AxiosError, void>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptData, AxiosError, void>({
    ...options,
    mutationFn: () => publishGoodsReceipt(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(id) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
