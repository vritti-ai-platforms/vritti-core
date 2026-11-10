import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { INBOUND_DELIVERIES_KEY } from '@/hooks/legal-entity/inbound-deliveries/keys';
import { PURCHASE_ORDERS_KEY } from '@/hooks/legal-entity/purchase-orders/keys';
import type { AddGoodsReceiptPurchaseOrderPayload } from '@/schemas/goods-receipts';
import { addGoodsReceiptPurchaseOrder } from '@/services/legal-entity/goods-receipts.service';
import { GOODS_RECEIPT_KEY } from './keys';

// Adds every open line of another purchase order to a draft receipt; the receipt, deliveries and purchase orders refresh
export function useAddGoodsReceiptPurchaseOrder(
  goodsReceiptId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddGoodsReceiptPurchaseOrderPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, AddGoodsReceiptPurchaseOrderPayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptPurchaseOrder(goodsReceiptId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
