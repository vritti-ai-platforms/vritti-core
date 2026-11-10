import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { INBOUND_DELIVERIES_KEY } from '@/hooks/site/inbound-deliveries/keys';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import { removeGoodsReceiptItem } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPT_KEY } from './keys';

// Removes an item with its lots, lines and serials; the receipt and the purchase orders refresh
export function useRemoveGoodsReceiptItem(
  goodsReceiptId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (itemId) => removeGoodsReceiptItem(goodsReceiptId, itemId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
