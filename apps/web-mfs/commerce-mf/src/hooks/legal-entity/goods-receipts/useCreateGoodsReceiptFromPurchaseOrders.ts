import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { INBOUND_DELIVERIES_KEY } from '@/hooks/legal-entity/inbound-deliveries/keys';
import { PURCHASE_ORDERS_KEY } from '@/hooks/legal-entity/purchase-orders/keys';
import type { CreateGoodsReceiptFromPurchaseOrdersPayload, GoodsReceiptData } from '@/schemas/goods-receipts';
import { createGoodsReceiptFromPurchaseOrders } from '@/services/legal-entity/goods-receipts.service';
import { GOODS_RECEIPTS_TABLE_KEY } from './keys';

// Starts a draft goods receipt of a supplier's purchase orders with the delivery it creates; receipts, deliveries and purchase orders refresh
export function useCreateGoodsReceiptFromPurchaseOrders(
  options?: Omit<
    UseMutationOptions<CreateResponse<GoodsReceiptData>, AxiosError, CreateGoodsReceiptFromPurchaseOrdersPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<GoodsReceiptData>, AxiosError, CreateGoodsReceiptFromPurchaseOrdersPayload>({
    ...options,
    mutationFn: createGoodsReceiptFromPurchaseOrders,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
