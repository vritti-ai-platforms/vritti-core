import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddGoodsReceiptLotPayload, GoodsReceiptLotData } from '@/schemas/goods-receipts';
import { addGoodsReceiptLot } from '@/services/legal-entity/goods-receipts.service';

// Adds a lot to a goods receipt item; the receipt and the purchase orders refresh
export function useAddGoodsReceiptLot(
  goodsReceiptId: string,
  itemId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<GoodsReceiptLotData>, AxiosError, AddGoodsReceiptLotPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<GoodsReceiptLotData>, AxiosError, AddGoodsReceiptLotPayload>({
    ...options,
    mutationFn: (data) => addGoodsReceiptLot(goodsReceiptId, itemId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceiptLots]);
      options?.onSuccess?.(...args);
    },
  });
}
