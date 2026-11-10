import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { INBOUND_DELIVERIES_KEY } from '@/hooks/site/inbound-deliveries/keys';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { UpdateGoodsReceiptItemPayload } from '@/schemas/goods-receipts';
import { updateGoodsReceiptItem } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPT_KEY } from './keys';

// Updates an item's received and rejected quantities; the receipt and the purchase orders refresh
export function useUpdateGoodsReceiptItem(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateGoodsReceiptItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateGoodsReceiptItemPayload>({
    ...options,
    mutationFn: (data) => updateGoodsReceiptItem(goodsReceiptId, itemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
