import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddGoodsReceiptLinePayload, GoodsReceiptLineData } from '@/schemas/goods-receipts';
import { addGoodsReceiptLine } from '@/services/site/goods-receipts.service';

// Distributes part of an item's accepted quantity to a storage location; the receipt and the purchase orders refresh
export function useAddGoodsReceiptLine(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<GoodsReceiptLineData>, AxiosError, AddGoodsReceiptLinePayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<GoodsReceiptLineData>, AxiosError, AddGoodsReceiptLinePayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptLine(goodsReceiptId, itemId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceiptLines]);
      options?.onSuccess?.(...args);
    },
  });
}
