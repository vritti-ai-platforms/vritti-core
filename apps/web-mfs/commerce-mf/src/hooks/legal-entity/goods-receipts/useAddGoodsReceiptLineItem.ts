import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddGoodsReceiptLineItemPayload, GoodsReceiptLineItemData } from '@/schemas/goods-receipts';
import { addGoodsReceiptLineItem } from '@/services/legal-entity/goods-receipts.service';

// Adds a serial to a line; the receipt and the purchase orders refresh
export function useAddGoodsReceiptLineItem(
  goodsReceiptId: string,
  itemId: string,
  lineId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<GoodsReceiptLineItemData>, AxiosError, AddGoodsReceiptLineItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<GoodsReceiptLineItemData>, AxiosError, AddGoodsReceiptLineItemPayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptLineItem(goodsReceiptId, itemId, lineId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceiptLineItems, Tables.goodsReceiptLines]);
      options?.onSuccess?.(...args);
    },
  });
}
