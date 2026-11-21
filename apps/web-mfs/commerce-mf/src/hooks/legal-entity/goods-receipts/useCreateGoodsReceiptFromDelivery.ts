import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateGoodsReceiptFromDeliveryPayload, GoodsReceiptData } from '@/schemas/goods-receipts';
import { createGoodsReceiptFromDelivery } from '@/services/legal-entity/goods-receipts.service';

// Starts a draft goods receipt of an announced inbound delivery; receipts, deliveries and purchase orders refresh
export function useCreateGoodsReceiptFromDelivery(
  options?: Omit<
    UseMutationOptions<CreateResponse<GoodsReceiptData>, AxiosError, CreateGoodsReceiptFromDeliveryPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<GoodsReceiptData>, AxiosError, CreateGoodsReceiptFromDeliveryPayload>({
    ...options,
    mutationFn: createGoodsReceiptFromDelivery,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceipts, Tables.goodsReceiptItems]);
      options?.onSuccess?.(...args);
    },
  });
}
