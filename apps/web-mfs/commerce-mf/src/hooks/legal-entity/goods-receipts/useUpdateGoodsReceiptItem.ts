import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateGoodsReceiptItemPayload } from '@/schemas/goods-receipts';
import { updateGoodsReceiptItem } from '@/services/legal-entity/goods-receipts.service';

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
      invalidateWrites(queryClient, [Tables.goodsReceiptItems]);
      options?.onSuccess?.(...args);
    },
  });
}
