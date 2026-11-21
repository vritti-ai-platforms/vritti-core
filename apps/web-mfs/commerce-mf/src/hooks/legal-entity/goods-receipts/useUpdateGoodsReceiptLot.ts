import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateGoodsReceiptLotPayload } from '@/schemas/goods-receipts';
import { updateGoodsReceiptLot } from '@/services/legal-entity/goods-receipts.service';

// Updates a lot's number, dates or MRP; the receipt and the purchase orders refresh
export function useUpdateGoodsReceiptLot(
  goodsReceiptId: string,
  itemId: string,
  lotId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateGoodsReceiptLotPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateGoodsReceiptLotPayload>({
    ...options,
    mutationFn: (data) => updateGoodsReceiptLot(goodsReceiptId, itemId, lotId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.goodsReceiptLots]);
      options?.onSuccess?.(...args);
    },
  });
}
