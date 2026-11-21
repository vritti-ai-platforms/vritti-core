import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteGoodsReceipt } from '@/services/legal-entity/goods-receipts.service';

// Deletes a draft goods receipt; the receipts list and the purchase orders' receipt lists refresh
export function useDeleteGoodsReceipt(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteGoodsReceipt,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.goodsReceipts,
        Tables.goodsReceiptItems,
        Tables.goodsReceiptLots,
        Tables.goodsReceiptLines,
        Tables.goodsReceiptLineItems,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
