import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { GOODS_RECEIPTS_TABLE_KEY } from '@/hooks/site/goods-receipts/keys';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import type { ReceiveInboundDeliveryPayload } from '@/schemas/inbound-deliveries';
import { receiveInboundDelivery } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY, INBOUND_DELIVERY_KEY } from './keys';

// Starts a draft goods receipt of a delivery's open lines; deliveries, receipts and purchase orders refresh
export function useReceiveInboundDelivery(
  options?: Omit<
    UseMutationOptions<CreateResponse<GoodsReceiptData>, AxiosError, ReceiveInboundDeliveryPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<GoodsReceiptData>, AxiosError, ReceiveInboundDeliveryPayload>({
    ...options,
    mutationFn: receiveInboundDelivery,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERY_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
